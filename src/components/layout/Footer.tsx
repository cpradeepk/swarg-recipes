export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 py-6">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Swarg Recipes. All rights reserved.</p>
        <p>Delicious meals, effortlessly prepared.</p>
      </div>
    </footer>
  );
}
