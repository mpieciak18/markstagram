CREATE TABLE "Comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"message" varchar(2200) NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL,
	CONSTRAINT "Comment_message_len_chk" CHECK (char_length(btrim("Comment"."message")) BETWEEN 1 AND 2200)
);
--> statement-breakpoint
CREATE TABLE "Conversation" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_ConversationToUser" (
	"A" integer NOT NULL,
	"B" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Follow" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"giverId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	CONSTRAINT "Follow_no_self_chk" CHECK ("Follow"."giverId" <> "Follow"."receiverId")
);
--> statement-breakpoint
CREATE TABLE "Like" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"message" varchar(2000) NOT NULL,
	"senderId" integer NOT NULL,
	"conversationId" integer NOT NULL,
	CONSTRAINT "Message_message_len_chk" CHECK (char_length(btrim("Message"."message")) BETWEEN 1 AND 2000)
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" integer NOT NULL,
	"otherUserId" integer NOT NULL,
	"postId" integer,
	"type" varchar(30) NOT NULL,
	"read" boolean NOT NULL,
	CONSTRAINT "Notification_type_len_chk" CHECK (char_length(btrim("Notification"."type")) BETWEEN 1 AND 30)
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"image" text NOT NULL,
	"caption" varchar(2200) NOT NULL,
	"userId" integer NOT NULL,
	CONSTRAINT "Post_caption_len_chk" CHECK (char_length(btrim("Post"."caption")) BETWEEN 1 AND 2200)
);
--> statement-breakpoint
CREATE TABLE "Save" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"email" varchar(254) NOT NULL,
	"username" varchar(15) NOT NULL,
	"password" varchar(60) NOT NULL,
	"name" varchar(30) NOT NULL,
	"bio" varchar(160),
	"image" text,
	CONSTRAINT "User_email_not_blank_chk" CHECK (char_length(btrim("User"."email")) >= 3),
	CONSTRAINT "User_username_len_chk" CHECK (char_length(btrim("User"."username")) BETWEEN 3 AND 15),
	CONSTRAINT "User_name_len_chk" CHECK (char_length(btrim("User"."name")) BETWEEN 3 AND 30),
	CONSTRAINT "User_password_bcrypt_chk" CHECK ("User"."password" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$')
);
--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_ConversationToUser" ADD CONSTRAINT "_ConversationToUser_A_Conversation_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Conversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_ConversationToUser" ADD CONSTRAINT "_ConversationToUser_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_giverId_User_id_fk" FOREIGN KEY ("giverId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_receiverId_User_id_fk" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_otherUserId_User_id_fk" FOREIGN KEY ("otherUserId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Save" ADD CONSTRAINT "Save_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Save" ADD CONSTRAINT "Save_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "_ConversationToUser_AB_unique" ON "_ConversationToUser" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_ConversationToUser_B_index" ON "_ConversationToUser" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "Follow_giverId_receiverId_key" ON "Follow" USING btree ("giverId","receiverId");--> statement-breakpoint
CREATE UNIQUE INDEX "Like_userId_postId_key" ON "Like" USING btree ("userId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX "Post_image_key" ON "Post" USING btree ("image");--> statement-breakpoint
CREATE UNIQUE INDEX "Save_userId_postId_key" ON "Save" USING btree ("userId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "User" USING btree ("username");