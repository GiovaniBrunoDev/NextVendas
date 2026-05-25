import { Composition } from "remotion";
import { SalvarSiteIphone } from "./SalvarSiteIphone";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SalvarSiteIphone"
      component={SalvarSiteIphone}
      durationInFrames={720}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
