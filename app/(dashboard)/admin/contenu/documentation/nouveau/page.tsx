"use client";

/**
 * Page de création d'une nouvelle catégorie de documentation
 */

import { useState } from "react";
import { Box, Flex, Heading, Text, TextField, TextArea, Button, Card } from "@radix-ui/themes";
import { BookOpenText, ArrowLeft, FloppyDisk, Eye, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  docCategorySchema,
  type DocCategoryFormData,
  generateSlug,
} from "@/schemas/content.schema";
import { createDocCategory } from "@/actions/admin/documentation";
import { IconPicker, ColorPicker, StatusSelect } from "@/components/admin/content";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function NouvelleCategoriePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DocCategoryFormData>({
    resolver: zodResolver(docCategorySchema) as never,
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      icon: "Book",
      color: "blue",
      ordre: 0,
      status: "DRAFT",
    },
  });

  const [slug, title, description, icon, color, status] = watch([
    "slug",
    "title",
    "description",
    "icon",
    "color",
    "status",
  ]);
  const watchedValues = { slug, title, description, icon, color, status };
  const PreviewIcon =
    (LucideIcons as unknown as Record<string, LucideIcon>)[watchedValues.icon] || BookOpenText;

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    if (!watchedValues.slug || watchedValues.slug === generateSlug(watch("title"))) {
      setValue("slug", generateSlug(title));
    }
  };

  const onSubmit = async (data: DocCategoryFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createDocCategory(data);
      if (result.success) {
        toast.success("Catégorie créée avec succès");
        router.push(`/admin/contenu/documentation/${result.data?.id}`);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Flex align="center" gap="4" mb="6">
          <Link href="/admin/contenu/documentation">
            <Button variant="ghost" size="2" style={{ cursor: "pointer" }}>
              <ArrowLeft size={18} weight="bold" />
            </Button>
          </Link>
          <Box>
            <Heading size="5">Nouvelle catégorie</Heading>
            <Text size="2" color="gray">
              Créez une nouvelle catégorie de documentation
            </Text>
          </Box>
        </Flex>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit as never)}>
        <Flex gap="6" direction={{ initial: "column", lg: "row" }}>
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ flex: 2 }}
          >
            <Card size="3">
              <Flex direction="column" gap="5">
                {/* Title */}
                <Box>
                  <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                    Titre <Text color="red">*</Text>
                  </Text>
                  <TextField.Root
                    size="3"
                    placeholder="Ex: Guide de démarrage"
                    {...register("title")}
                    onChange={handleTitleChange}
                  />
                  {errors.title ? (
                    <Text size="1" color="red" mt="1">
                      {errors.title.message}
                    </Text>
                  ) : null}
                </Box>

                {/* Slug */}
                <Box>
                  <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                    Slug (URL) <Text color="red">*</Text>
                  </Text>
                  <TextField.Root size="3" placeholder="guide-demarrage" {...register("slug")}>
                    <TextField.Slot side="left">
                      <Text size="1" color="gray">
                        /docs/
                      </Text>
                    </TextField.Slot>
                  </TextField.Root>
                  {errors.slug ? (
                    <Text size="1" color="red" mt="1">
                      {errors.slug.message}
                    </Text>
                  ) : null}
                  <Text size="1" color="gray" mt="1">
                    URL finale: /docs/{watchedValues.slug || "..."}
                  </Text>
                </Box>

                {/* Description */}
                <Box>
                  <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                    Description
                  </Text>
                  <TextArea
                    size="3"
                    placeholder="Description courte de cette catégorie..."
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description ? (
                    <Text size="1" color="red" mt="1">
                      {errors.description.message}
                    </Text>
                  ) : null}
                </Box>

                {/* Icon & Color */}
                <Flex gap="4">
                  <Box style={{ flex: 1 }}>
                    <IconPicker
                      value={watchedValues.icon}
                      onChange={(val) => setValue("icon", val)}
                      label="Icône"
                      type="doc"
                      error={errors.icon?.message}
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <ColorPicker
                      value={watchedValues.color}
                      onChange={(val) => setValue("color", val)}
                      label="Couleur"
                      error={errors.color?.message}
                    />
                  </Box>
                </Flex>

                {/* Status & Order */}
                <Flex gap="4">
                  <Box style={{ flex: 1 }}>
                    <StatusSelect
                      value={watchedValues.status}
                      onChange={(val) => setValue("status", val)}
                      label="Statut"
                      error={errors.status?.message}
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                      Ordre d'affichage
                    </Text>
                    <TextField.Root
                      size="3"
                      type="number"
                      min={0}
                      placeholder="0"
                      {...register("ordre")}
                    />
                    <Text size="1" color="gray" mt="1">
                      Les catégories sont triées par ordre croissant
                    </Text>
                  </Box>
                </Flex>
              </Flex>
            </Card>
          </motion.div>

          {/* Preview & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ flex: 1 }}
          >
            <Flex direction="column" gap="4">
              {/* Preview Card */}
              <Card size="3">
                <Flex align="center" gap="2" mb="4">
                  <Eye size={16} weight="duotone" style={{ color: "var(--gray-10)" }} />
                  <Text size="2" weight="medium">
                    Aperçu
                  </Text>
                </Flex>

                <Box
                  p="4"
                  style={{
                    background: `var(--${watchedValues.color}-a2)`,
                    borderRadius: 12,
                    border: `1px solid var(--${watchedValues.color}-a4)`,
                  }}
                >
                  <Flex align="center" gap="3">
                    <Box
                      p="3"
                      style={{
                        background: `var(--${watchedValues.color}-9)`,
                        borderRadius: 10,
                      }}
                    >
                      <PreviewIcon size={20} style={{ color: "white" }} />
                    </Box>
                    <Box>
                      <Text size="3" weight="medium" style={{ display: "block" }}>
                        {watchedValues.title || "Titre de la catégorie"}
                      </Text>
                      <Text size="1" color="gray">
                        {watchedValues.description || "Description de la catégorie"}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Card>

              {/* Actions */}
              <Card size="3">
                <Flex direction="column" gap="3">
                  <Button
                    type="submit"
                    size="3"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      background: "var(--blue-9)",
                      cursor: isSubmitting ? "wait" : "pointer",
                    }}
                  >
                    {isSubmitting ? (
                      <>Création...</>
                    ) : (
                      <>
                        <Sparkle size={18} weight="bold" />
                        Créer la catégorie
                      </>
                    )}
                  </Button>

                  <Link href="/admin/contenu/documentation" style={{ width: "100%" }}>
                    <Button
                      type="button"
                      variant="soft"
                      color="gray"
                      size="3"
                      style={{ width: "100%", cursor: "pointer" }}
                    >
                      Annuler
                    </Button>
                  </Link>
                </Flex>
              </Card>

              {/* Tips */}
              <Card size="2">
                <Flex align="center" gap="2" mb="2">
                  <Sparkle size={14} weight="duotone" style={{ color: "var(--violet-9)" }} />
                  <Text size="2" weight="medium">
                    Conseils
                  </Text>
                </Flex>
                <Flex direction="column" gap="2">
                  <Text size="1" color="gray">
                    • Utilisez un titre court et descriptif
                  </Text>
                  <Text size="1" color="gray">
                    • Le slug sera utilisé dans l'URL
                  </Text>
                  <Text size="1" color="gray">
                    • Choisissez une icône représentative
                  </Text>
                  <Text size="1" color="gray">
                    • Vous pourrez ajouter des articles après
                  </Text>
                </Flex>
              </Card>
            </Flex>
          </motion.div>
        </Flex>
      </form>
    </Box>
  );
}
