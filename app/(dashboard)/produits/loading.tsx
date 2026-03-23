import { Flex, Box } from "@radix-ui/themes";

export default function ProduitsLoading() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: "50vh" }} role="status" aria-live="polite">
      <Box style={{ textAlign: "center" }}>
        <div
          aria-label="Chargement des produits"
          style={{
            width: 40,
            height: 40,
            border: "4px solid var(--gray-a4)",
            borderTopColor: "var(--accent-9)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }}
        />
        <p style={{ color: "var(--gray-11)", marginTop: 16, fontSize: 14 }}>
          Chargement des produits...
        </p>
      </Box>
    </Flex>
  );
}
