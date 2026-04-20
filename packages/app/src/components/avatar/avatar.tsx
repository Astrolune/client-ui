import { PersonIcon } from "@primer/octicons-react"
import "./avatar.scss"
import { ReactElement } from "react"
import cn from "classnames"

export type AvatarStatus = "online" | "dnd" | "inactive" | "offline" | "invisible"

export interface AvatarProps
  extends Omit<
    React.DetailedHTMLProps<
      React.ImgHTMLAttributes<HTMLImageElement>,
      HTMLImageElement
    >,
    "src"
  > {
  size: number
  src?: string | ReactElement | null
  status?: AvatarStatus
  rounded?: boolean
}

export function Avatar({ size, alt, src, status, rounded, ...props }: AvatarProps) {
  return (
    <div
      className={cn("profile-avatar", { "profile-avatar--rounded": rounded })}
      style={{ width: size, height: size }}
    >
      {!src ? (
        <PersonIcon size={size * 0.7} />
      ) : typeof src === "string" ? (
        <img
          className="profile-avatar__image"
          alt={alt}
          src={src}
          {...props}
        />
      ) : (
        src
      )}
      {status && (
        <span
          className={cn("profile-avatar__status", `profile-avatar__status--${status}`)}
        />
      )}
    </div>
  )
}
