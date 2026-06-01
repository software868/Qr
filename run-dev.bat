@echo off
subst R: C:\Users\Belal\Desktop\QR 2>nul
R:
cd \
set DATABASE_URL=
set AUTH_SECRET=
set NEXTAUTH_SECRET=
set NEXTAUTH_URL=
set NEXT_PUBLIC_APP_URL=
set CLOUDINARY_CLOUD_NAME=
set CLOUDINARY_API_KEY=
set CLOUDINARY_API_SECRET=
npx.cmd next dev --webpack
