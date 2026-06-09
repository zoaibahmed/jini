import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('resources')
@UseGuards(AuthGuard('jwt'))
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async getArticles(
    @Query('category') category?: string,
    @Query('all') all?: string
  ) {
    const onlyActive = all !== 'true';
    return this.resourcesService.getArticles(category, onlyActive);
  }

  @Get(':id')
  async getArticleById(@Param('id') id: string) {
    return this.resourcesService.getArticleById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async createArticle(
    @Body() body: {
      title: string;
      content: string;
      category: string;
      pdfUrl?: string;
      videoUrl?: string;
      isActive?: boolean;
    }
  ) {
    return this.resourcesService.createArticle(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async updateArticle(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      content?: string;
      category?: string;
      pdfUrl?: string;
      videoUrl?: string;
      isActive?: boolean;
    }
  ) {
    return this.resourcesService.updateArticle(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async deleteArticle(@Param('id') id: string) {
    return this.resourcesService.deleteArticle(id);
  }
}
