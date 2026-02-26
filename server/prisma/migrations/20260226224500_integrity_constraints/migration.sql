-- Harden data integrity with explicit lengths and check constraints.

ALTER TABLE "User"
  ALTER COLUMN "email" TYPE VARCHAR(254),
  ALTER COLUMN "username" TYPE VARCHAR(15),
  ALTER COLUMN "password" TYPE VARCHAR(60),
  ALTER COLUMN "name" TYPE VARCHAR(30),
  ALTER COLUMN "bio" TYPE VARCHAR(160);

ALTER TABLE "Post"
  ALTER COLUMN "caption" TYPE VARCHAR(2200);

ALTER TABLE "Comment"
  ALTER COLUMN "message" TYPE VARCHAR(2200);

ALTER TABLE "Message"
  ALTER COLUMN "message" TYPE VARCHAR(2000);

ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE VARCHAR(30);

ALTER TABLE "User"
  ADD CONSTRAINT "User_email_not_blank_chk"
  CHECK (char_length(btrim("email")) >= 3),
  ADD CONSTRAINT "User_username_len_chk"
  CHECK (char_length(btrim("username")) BETWEEN 3 AND 15),
  ADD CONSTRAINT "User_name_len_chk"
  CHECK (char_length(btrim("name")) BETWEEN 3 AND 30),
  ADD CONSTRAINT "User_password_bcrypt_chk"
  CHECK ("password" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');

ALTER TABLE "Post"
  ADD CONSTRAINT "Post_caption_len_chk"
  CHECK (char_length(btrim("caption")) BETWEEN 1 AND 2200);

ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_message_len_chk"
  CHECK (char_length(btrim("message")) BETWEEN 1 AND 2200);

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_message_len_chk"
  CHECK (char_length(btrim("message")) BETWEEN 1 AND 2000);

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_type_len_chk"
  CHECK (char_length(btrim("type")) BETWEEN 1 AND 30);

ALTER TABLE "Follow"
  ADD CONSTRAINT "Follow_no_self_chk"
  CHECK ("giverId" <> "receiverId");
