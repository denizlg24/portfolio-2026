import mongoose,{Schema,Document} from "mongoose";

export interface IBlogComment extends Document {
    blogId:string;
    commentId?:string;
    authorName:string;
    authorEmail:string;
    content:string;
    isApproved:boolean;
    createdAt:Date;
    updatedAt:Date;
}

export interface ILeanBlogComment {
    _id:string;
    blogId:string;
    commentId?:string;
    authorName:string;
    authorEmail:string;
    content:string;
    isApproved:boolean;
    createdAt:Date;
    updatedAt:Date;
}

const BlogCommentSchema = new Schema<IBlogComment>(
    {
        blogId: {
            type: String,
            required: true,
            trim: true,
        },
        commentId: {
            type: String,
            trim: true,
            ref: "BlogComment",
        },
        authorName: {
            type: String,
            required: true,
            trim: true,
        },
        authorEmail: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        isApproved: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const BlogComment: mongoose.Model<IBlogComment> = mongoose.models.BlogComment || mongoose.model<IBlogComment>("BlogComment", BlogCommentSchema);