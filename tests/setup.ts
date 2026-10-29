import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock server-only so tests importing server-only modules run in Vitest
vi.mock("server-only", () => ({}));
