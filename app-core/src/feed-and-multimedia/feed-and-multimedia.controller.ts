import { Body, Controller, Get, Post, UseGuards, Param, Delete, Put, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeedAndMultimediaService } from './feed-and-multimedia.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';


// This controller handles feed posts and comments, including multimedia uploads for posts.
@Controller('feed')
@UseGuards(AuthenticatedGuard)
export class FeedAndMultimediaController {
  constructor(private readonly service: FeedAndMultimediaService) {}


  // Post creation with optional file upload. If a file is included, it will be processed and associated with the post.
  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.service.createPost(dto, user._id.toString());
  }


  // Separate endpoint for creating a post with a file upload. This allows clients to upload multimedia content along with the post data.
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

  
  // Get feed and individual posts 
  @UseGuards(AuthenticatedGuard)
  @Get()
  async getFeed() {
    return this.service.getFeed();
  }


  // Get a single post by ID, including its comments and multimedia content if available.
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


  // Only the post author can delete the post, which also deletes all associated comments and multimedia content.
  @UseGuards(AuthenticatedGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deletePost(id, user._id.toString());
  }

  // Comment creation, retrieval, deletion, and liking/unliking. Comments can be nested (replies) and are associated with a specific post.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const dto: CreateCommentDto = {
      content: body.content,
      postId: id,
      authorId: user._id.toString(),
      parentId: body.parentId,
    } as CreateCommentDto;
    return this.service.addComment(dto, user._id.toString());
  }


  // Get all comments for a specific post, including nested replies. Comments are returned in a hierarchical structure to reflect the parent-child relationships.
  @UseGuards(AuthenticatedGuard)
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.service.getCommentsForPost(id);
  }


  // Only the comment author can delete the comment. Deleting a comment also deletes all its nested replies.
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.service.deleteComment(commentId, user._id.toString());
  }


  // Liking and unliking comments and posts. Users can like both posts and comments, and these endpoints handle the creation and removal of likes. The service ensures that users can only like a post or comment once and can unlike it if they change their mind.
  @UseGuards(AuthenticatedGuard)
  @Post('comments/:commentId/likes')
  async likeComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.service.likeComment(commentId, user._id.toString());
  }


  // Unliking a comment allows users to remove their like from a comment they previously liked. This endpoint ensures that the like is removed correctly and that the user can only unlike comments they have liked.
  @UseGuards(AuthenticatedGuard)
  @Delete('comments/:commentId/likes')
  async unlikeComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.service.unlikeComment(commentId, user._id.toString());
  }


// Liking and unliking posts. Similar to comments, users can like and unlike posts, and these endpoints manage the likes for posts. The service ensures that users can only like a post once and can unlike it if they change their mind.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/likes')
  async addLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.likePost(id, user._id.toString());
  }


  // Unliking a post allows users to remove their like from a post they previously liked. This endpoint ensures that the like is removed correctly and that the user can only unlike posts they have liked.
  @UseGuards(AuthenticatedGuard)
  @Delete(':id/likes')
  async removeLike(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.unlikePost(id, user._id.toString());
  }


  // Incrementing post views. This endpoint is called when a user views a post, and it increments the view count for that post. The service ensures that the same user cannot increment the view count multiple times in a short period to prevent abuse.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/views')
  async addView(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.incrementView(id, user._id.toString());
  }

  // Increment share count on a post. Called when a user shares a post.
  @UseGuards(AuthenticatedGuard)
  @Post(':id/shares')
  async addShare(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.incrementShare(id, user._id.toString());
  }
}
