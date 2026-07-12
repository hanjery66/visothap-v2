import clsx from "clsx";
import Image from "next/image";
import { ComponentProps } from "react";
import { Ads } from "@/db/schema";

type Props = {
  ad: Ads;
};

const AdsCard = ({ ad, ...rest }: Props & ComponentProps<"div">) => {
  return (
    <div
      {...rest}
      className={clsx(
        "relative rounded-xs  shadow-sm overflow-hidden group",
        rest.className,
      )}
    >
      <Image
        src={ad.image}
        alt={ad.title}
        fill
        className="w-full h-full object-cover  group-hover:scale-105 transition-all duration-200"
        unoptimized={ad.image.startsWith("http")}
      />
      <div className="absolute translate-y-14 group-hover:translate-y-0 text-primary-foreground w-full transition-all duration-200 bottom-0 py-2 left-1/2 -translate-x-1/2 text-center  font-semibold border-t border-primary/80 bg-primary ">
        {ad.title}
      </div>
    </div>
  );
};

export default AdsCard;
