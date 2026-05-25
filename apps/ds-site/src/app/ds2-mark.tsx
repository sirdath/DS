/**
 * DS2 wordmark as inline SVG (fill: currentColor) for the nav.
 * Colour it via CSS `color` on the element. Used in both the home nav and the
 * shared PageChrome nav so the top-left logo matches the hero wordmark.
 */
export function DS2Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1136 285" fill="currentColor" role="img" aria-label="DS2">
      <path d="M 18 10 L 291 11 L 340 33 L 371 82 L 375 124 L 375 180 L 363 222 L 327 260 L 285 273 L 19 273 L 10 262 L 10 220 L 21 211 L 273 211 L 301 195 L 310 153 L 310 111 L 300 83 L 273 69 L 21 69 L 10 60 L 10 18 L 15 11 Z" />
      <path d="M 466 10 L 736 10 L 744 17 L 744 53 L 735 69 L 474 70 L 459 93 L 473 109 L 680 111 L 725 125 L 753 159 L 760 195 L 752 231 L 721 263 L 685 273 L 406 273 L 397 270 L 394 225 L 405 211 L 675 211 L 693 205 L 690 178 L 663 175 L 474 174 L 438 162 L 406 131 L 394 95 L 396 68 L 418 32 L 454 12 L 463 11 Z" />
      <path d="M 800 10 L 1061 11 L 1106 34 L 1126 70 L 1128 97 L 1117 133 L 1086 165 L 1050 175 L 870 175 L 845 191 L 838 209 L 1116 211 L 1127 224 L 1127 260 L 1116 273 L 783 273 L 776 266 L 775 212 L 784 167 L 813 132 L 858 112 L 1038 111 L 1064 99 L 1056 73 L 1038 69 L 804 69 L 795 66 L 792 21 L 796 12 Z" />
    </svg>
  );
}
