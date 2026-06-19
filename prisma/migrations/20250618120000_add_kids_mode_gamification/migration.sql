-- CreateEnum
CREATE TYPE "ProfileMode" AS ENUM ('ADULT', 'KIDS');
CREATE TYPE "ModuleAudience" AS ENUM ('ADULT', 'KIDS', 'ALL');
CREATE TYPE "DailyMissionType" AS ENUM ('LOGIN', 'COMPLETE_LESSON', 'QUIZ_CORRECT');

-- AlterTable users
ALTER TABLE "users" ADD COLUMN "profile_mode" "ProfileMode" NOT NULL DEFAULT 'ADULT';
ALTER TABLE "users" ADD COLUMN "total_xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN "avatar_config" JSONB;
ALTER TABLE "users" ADD COLUMN "current_streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "last_activity_date" TIMESTAMP(3);

-- AlterTable modules
ALTER TABLE "modules" ADD COLUMN "audience" "ModuleAudience" NOT NULL DEFAULT 'ADULT';
ALTER TABLE "modules" ADD COLUMN "kids_meta" JSONB;

-- AlterTable progress
ALTER TABLE "progress" ADD COLUMN "checklist_state" JSONB;

-- CreateTable badges
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_emoji" TEXT NOT NULL DEFAULT '🏅',
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateTable user_badges
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable daily_missions
CREATE TABLE "daily_missions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "DailyMissionType" NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_missions_user_id_date_type_key" ON "daily_missions"("user_id", "date", "type");

ALTER TABLE "daily_missions" ADD CONSTRAINT "daily_missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
