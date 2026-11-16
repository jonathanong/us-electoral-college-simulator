import { render } from "preact";
import { dataset } from "./data/index.ts";
import { App } from "./ui/App.tsx";
import "./ui/styles.css";

render(<App data={dataset} />, document.getElementById("app")!);
