import clsx from "clsx";
import Image from "next/image";
import { ComponentProps } from "react";
import { Ads } from "@/db/schema";

type Props = {
  ad: Ads;
  imageClassName?: string;
};

const AdsCard = ({
  ad,
  imageClassName,
  ...rest
}: Props & ComponentProps<"div">) => {
  return (
    <div
      {...rest}
      className={clsx(
        "relative shadow-xs overflow-hidden shrink-0 w-full",
        rest.className,
      )}
    >
      <Image
        src={ad.image}
        alt="Advertisement"
        fill
        className={clsx("w-full h-full object-cover", imageClassName)}
        unoptimized={ad.image.startsWith("http")}
      />
    </div>
  );
};

export default AdsCard;
