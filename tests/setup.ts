import { cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";

// jsdom does not implement scrolling.
Element.prototype.scrollIntoView = () => {};

afterEach(() => cleanup());
