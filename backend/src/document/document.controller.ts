import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, Headers, Req, Res, BadRequestException } from '@nestjs/common';
import { DocumentService } from './document.service';
import { UserRole } from '@prisma/client';
import * as express from 'express';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // Utility to extract User ID and Role from headers (simulated auth metadata)
  private getAuthContext(userIdHeader?: string, roleHeader?: string) {
    if (!userIdHeader || userIdHeader === 'undefined' || userIdHeader === 'null' || userIdHeader === '') {
      return null;
    }
    const role = (roleHeader ? roleHeader.toUpperCase() : 'DRIVER') as UserRole;
    return { userId: userIdHeader, role };
  }

  @Get('categories')
  async getCategories() {
    return this.documentService.getCategories();
  }

  @Get()
  async getDocuments(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Query('category') categoryName?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const context = this.getAuthContext(userIdHeader, roleHeader);
    if (!context) return [];
    return this.documentService.getDocuments(context.userId, context.role, { categoryName, status, search });
  }

  @Post()
  async createDocument(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: {
      name: string;
      categoryName: string;
      size: string;
      expiryDate?: string;
      notes?: string;
      tags?: string[];
    }
  ) {
    const context = this.getAuthContext(userIdHeader, 'DRIVER');
    if (!context) throw new BadRequestException('User identification header (x-user-id) required');
    return this.documentService.createDocument(context.userId, body);
  }

  @Get('preview/:id')
  async getDocumentPreview(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') docId: string,
  ) {
    const context = this.getAuthContext(userIdHeader, roleHeader);
    if (!context) throw new BadRequestException('User identification header required');
    return this.documentService.getDocumentPreview(context.userId, context.role, docId);
  }

  @Patch(':id')
  async updateDocument(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') docId: string,
    @Body() body: {
      name?: string;
      notes?: string;
      tags?: string[];
      expiryDate?: string;
    }
  ) {
    const context = this.getAuthContext(userIdHeader, roleHeader);
    if (!context) throw new BadRequestException('User identification header required');
    return this.documentService.updateDocument(context.userId, context.role, docId, body);
  }

  @Delete(':id')
  async deleteDocument(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
    @Param('id') docId: string,
  ) {
    const context = this.getAuthContext(userIdHeader, roleHeader);
    if (!context) throw new BadRequestException('User identification header required');
    return this.documentService.deleteDocument(context.userId, context.role, docId);
  }

  @Get('logs')
  async getActivityLogs(
    @Headers('x-user-id') userIdHeader: string,
    @Headers('x-user-role') roleHeader: string,
  ) {
    const context = this.getAuthContext(userIdHeader, roleHeader);
    if (!context) return [];
    return this.documentService.getActivityLogs(context.userId, context.role);
  }

  @Get('presigned-url')
  async getPresignedUploadUrl(@Query('fileName') fileName: string) {
    if (!fileName) throw new BadRequestException('fileName query parameter is required');
    const url = await this.documentService.getPresignedUrl(fileName, 'PUT');
    return { uploadUrl: url };
  }

  @Put('upload-local')
  async uploadLocalFile(
    @Query('fileName') fileName: string,
    @Req() req: express.Request
  ) {
    if (!fileName) throw new BadRequestException('fileName query parameter is required');
    return this.documentService.saveFile(fileName, req);
  }

  @Get('download/:id')
  async downloadFile(
    @Param('id') docId: string,
    @Res() res: express.Response
  ) {
    const fileInfo = await this.documentService.getFile(docId);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const fs = require('fs');
    const readStream = fs.createReadStream(fileInfo.filePath);
    readStream.pipe(res);
  }
}
