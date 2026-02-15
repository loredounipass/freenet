import { Body, Controller, Get, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesAndMultimediaService } from './messages-and-multimedia.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { CurrentUser } from 'src/guard/auth/current-user.decorator';

@Controller('messages')
export class MessagesAndMultimediaController {
  constructor(private readonly service: MessagesAndMultimediaService) {}


  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(@Body() dto: CreateMessageDto, @CurrentUser() user: any) {
    return this.service.createMessage(dto, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
    // Limit uploads to 10MB by default to avoid OOM on large files
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post('upload')
  async createWithFile(@UploadedFile() file: Express.Multer.File, @Body() body: any, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('File missing');

    // Build DTO-like object
    const dto: CreateMessageDto = {
      content: body.content || '',
      type: body.type || ('image' as any),
      receiverId: body.receiverId,
      multimediaId: undefined,
      senderId: user._id.toString(),
    } as CreateMessageDto;

      // Updated for consistency after DTO/schema changes
      return this.service.createMessageWithFile(file, dto, user._id.toString());
  }

  @UseGuards(AuthenticatedGuard)
  @Get('me')
  async getMyMessages(@CurrentUser() user: any) {
    return this.service.getMessagesByUser(user._id.toString());
  }
}