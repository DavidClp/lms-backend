-- CreateTable
CREATE TABLE "student_module_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,

    CONSTRAINT "student_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_module_access_user_id_module_id_key" ON "student_module_access"("user_id", "module_id");

-- AddForeignKey
ALTER TABLE "student_module_access" ADD CONSTRAINT "student_module_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_module_access" ADD CONSTRAINT "student_module_access_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
