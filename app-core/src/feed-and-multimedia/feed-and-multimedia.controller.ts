import { Body, Controller, Get, Post, UseGuards, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeedAndMultimediaService } from './feed-and-multimedia.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';

@Controller('feed')
@UseGuards(AuthenticatedGuard)
export class FeedAndMultimediaController {
  constructor(private readonly service: FeedAndMultimediaService) {}

  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.service.createPost(dto, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post('upload')
  async createWithFile(@UploadedFile() file: Express.Multer.File, @Body() body: any, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('File missing');

    // Reject audio uploads for feed — feed supports only images and videos
    if (file.mimetype && file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('Audio uploads are not supported for feed posts');
    }

    return this.service.createPostWithFile(file, body, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getMyPosts(@CurrentUser() user: any) {
    return this.service.getPostsByUser(user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.service.getPostById(id);
  }

  // Post update/delete
  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.service.updatePost(id, body, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deletePost(id, user._id.toString());
  }

  // Comments
  @UseGuards(AuthenticatedGuard)
  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const dto: CreateCommentDto = {
      content: body.content,
      postId: id,
      authorId: user._id.toString(),
    } as CreateCommentDto;
    return this.service.addComment(dto, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.service.getCommentsForPost(id);
  }

  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.service.deleteComment(commentId, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':id/likes')
  async addLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.likePost(id, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Delete(':id/likes')
  async removeLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unlikePost(id, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':id/views')
  async addView(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.incrementView(id, user._id.toString());
  }
}
