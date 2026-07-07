import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);
  private readonly rpId = 'localhost'; 
  private readonly rpName = 'JNI Solutions';

  // Store active challenges in memory (key: phone/userId -> challenge)
  private readonly challengeStore = new Map<string, string>();

  generateRegistrationOptions(userId: string, userName: string) {
    const challenge = crypto.randomBytes(32).toString('base64url');
    this.challengeStore.set(`reg-${userId}`, challenge);

    return {
      challenge,
      rp: { name: this.rpName, id: this.rpId },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256 (standard Passkey algorithm)
        { type: 'public-key', alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
        residentKey: 'preferred',
        requireResidentKey: false,
      },
    };
  }

  verifyRegistration(userId: string, clientChallenge: string) {
    const savedChallenge = this.challengeStore.get(`reg-${userId}`);
    this.challengeStore.delete(`reg-${userId}`);

    if (!savedChallenge || savedChallenge !== clientChallenge) {
      throw new Error('Registration challenge mismatch or expired');
    }

    return true;
  }

  generateLoginOptions(passkeys: { id: string }[]) {
    const challenge = crypto.randomBytes(32).toString('base64url');
    const challengeId = crypto.randomBytes(16).toString('hex');
    this.challengeStore.set(`login-${challengeId}`, challenge);

    return {
      challengeId,
      options: {
        challenge,
        rpId: this.rpId,
        allowCredentials: passkeys.map(pk => ({
          type: 'public-key',
          id: pk.id,
        })),
        userVerification: 'preferred',
        timeout: 60000,
      },
    };
  }

  verifyLogin(
    challengeId: string,
    clientDataJson: string,
    authDataHex: string,
    signatureHex: string,
    publicKeySpkiHex: string,
  ): boolean {
    const savedChallenge = this.challengeStore.get(`login-${challengeId}`);
    this.challengeStore.delete(`login-${challengeId}`);

    if (!savedChallenge) {
      this.logger.error('Login challenge not found or expired');
      return false;
    }

    try {
      // Decode clientDataJSON to verify the challenge
      const clientDataStr = Buffer.from(clientDataJson, 'base64url').toString('utf8');
      const clientData = JSON.parse(clientDataStr);

      if (clientData.challenge !== savedChallenge) {
        this.logger.error('Login assertion challenge mismatch');
        return false;
      }

      // Reconstruct signature verification data:
      // signature is verified over SHA-256(clientDataJSON) prepended with authenticatorData
      const clientDataHash = crypto.createHash('sha256').update(Buffer.from(clientDataJson, 'base64url')).digest();
      const authData = Buffer.from(authDataHex, 'hex');
      const signature = Buffer.from(signatureHex, 'hex');

      const verificationData = Buffer.concat([authData, clientDataHash]);

      // Convert SPKI Hex public key to PEM format for verification
      const publicKeyPem = 
        `-----BEGIN PUBLIC KEY-----\n` +
        Buffer.from(publicKeySpkiHex, 'hex').toString('base64').match(/.{1,64}/g)!.join('\n') +
        `\n-----END PUBLIC KEY-----`;

      const verified = crypto.verify(
        'sha256',
        verificationData,
        {
          key: publicKeyPem,
          format: 'pem',
          type: 'spki',
        },
        signature,
      );

      return verified;
    } catch (err: any) {
      this.logger.error(`Signature verification failed: ${err.message}`);
      return false;
    }
  }
}
