-- CreateTable
CREATE TABLE "platform_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "disable_student_password" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- Insert default singleton row
INSERT INTO "platform_config" ("id", "disable_student_password", "created_at", "updated_at")
VALUES (1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
