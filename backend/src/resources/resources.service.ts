import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async createArticle(data: {
    title: string;
    content: string;
    category: string;
    pdfUrl?: string;
    videoUrl?: string;
    isActive?: boolean;
  }) {
    return this.prisma.resourceArticle.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        pdfUrl: data.pdfUrl || null,
        videoUrl: data.videoUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async getArticles(category?: string, onlyActive = true) {
    const whereClause: any = {};
    if (onlyActive) {
      whereClause.isActive = true;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    return this.prisma.resourceArticle.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArticleById(id: string) {
    const article = await this.prisma.resourceArticle.findUnique({
      where: { id },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async updateArticle(
    id: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      pdfUrl?: string;
      videoUrl?: string;
      isActive?: boolean;
    }
  ) {
    await this.getArticleById(id); // ensure exists
    
    return this.prisma.resourceArticle.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async deleteArticle(id: string) {
    await this.getArticleById(id); // ensure exists
    await this.prisma.resourceArticle.delete({
      where: { id },
    });
    return { success: true, message: 'Resource article removed successfully.' };
  }
}
