import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeFolderName, isAllowedFileExtension } from "@/lib/utils/sanitize";

// Types de fichiers autorises (whitelist MIME)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Dossiers autorises (whitelist stricte)
const ALLOWED_FOLDERS = ["produits", "categories", "etablissements", "avatars"];

export async function POST(request: NextRequest) {
  try {
    // 1. Verification d'authentification
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifie" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "produits";

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni" }, { status: 400 });
    }

    // 2. Verification de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Fichier trop volumineux. Maximum 5MB." },
        { status: 400 }
      );
    }

    // 3. Verification du type MIME (whitelist)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Type de fichier non autorise. Utilisez JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    // 4. Verification de l'extension du fichier (whitelist, defense en profondeur)
    if (!isAllowedFileExtension(file.name)) {
      return NextResponse.json(
        { success: false, error: "Extension de fichier non autorisee" },
        { status: 400 }
      );
    }

    // 5. Sanitisation et whitelist du dossier cible
    const folder = sanitizeFolderName(rawFolder);
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json({ success: false, error: "Dossier non autorise" }, { status: 400 });
    }

    // 6. Generation d'un nom de fichier securise (aucun input utilisateur dans le nom)
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeFileName = `${Date.now()}-${randomUUID()}.${ext}`;

    // 7. Construction securisee du chemin
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const uploadDir = path.join(uploadsRoot, folder);
    const filePath = path.join(uploadDir, safeFileName);

    // 8. Verification que le chemin final est bien dans le repertoire uploads
    //    (defense en profondeur contre path traversal)
    const resolvedFilePath = path.resolve(filePath);
    if (!resolvedFilePath.startsWith(uploadsRoot)) {
      return NextResponse.json({ success: false, error: "Chemin invalide" }, { status: 400 });
    }

    // 9. Creation du dossier et ecriture du fichier
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 10. Retourner l'URL relative
    const url = `/uploads/${folder}/${safeFileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName: safeFileName,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload du fichier" },
      { status: 500 }
    );
  }
}
