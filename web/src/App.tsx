import { lazy } from "react";
import Suspense from "@/components/Suspense";

const Upload = lazy(() => import("./pages/Upload"));

function App() {
  const mode = location.search.substring(1);

  switch (mode) {
    case "upload":
      return (
        <Suspense>
          <Upload />
        </Suspense>
      );
    case "file":
      break;
    case "dir":
      break;
    default:
      return "运行异常，请反馈开发者";
  }
}

export default App;
