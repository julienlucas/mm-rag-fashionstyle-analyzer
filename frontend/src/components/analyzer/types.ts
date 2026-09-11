export type Subject = {
  id: string;
  title: string;
  src: string;
  source: "example" | "upload";
  file?: File;
};

export type Analysis =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; answer: string; closestImageUrl: string; elapsed?: number; live: boolean }
  | { status: "error"; message: string };
