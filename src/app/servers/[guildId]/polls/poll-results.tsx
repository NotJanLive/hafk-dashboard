import { EyeOff, Trophy } from "lucide-react";
import { EmojiValue } from "@/components/ui/emoji-picker";
import type { Poll } from "@/lib/bot-api/types";
import { cn, formatNumber } from "@/lib/utils";

export const VISIBILITY_LABELS = {
  LIVE: "Live-Ergebnis",
  AFTER_VOTE: "Ergebnis nach der Stimme",
  CLOSED: "Ergebnis am Ende",
} as const;

export function optionEmoji(emoji: string | null, index: number) {
  return emoji ?? String.fromCodePoint(0x1f1e6 + index);
}

export function OptionIcon({ emoji, index }: { emoji: string | null; index: number }) {
  if (emoji) return <EmojiValue value={emoji} className="size-5 text-base" />;
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-[#55acee] text-[11px] font-bold text-white">
      {String.fromCharCode(65 + index)}
    </span>
  );
}

export function PollResults({ poll, showVoters = false }: { poll: Poll; showVoters?: boolean }) {
  if (!poll.resultsVisible) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
        <EyeOff className="mt-0.5 size-4 shrink-0" />
        <span>
          Zwischenstände sind bei dieser Umfrage ausgeblendet. Das Ergebnis erscheint hier, sobald sie endet. Bisher{" "}
          {poll.participants === 1 ? "hat 1 Person" : `haben ${formatNumber(poll.participants)} Personen`} teilgenommen.
        </span>
      </div>
    );
  }
  const best = Math.max(0, ...poll.options.map((option) => option.votes ?? 0));
  return (
    <ul className="space-y-4">
      {poll.options.map((option, index) => {
        const winner = poll.closedAt !== null && best > 0 && option.votes === best;
        return (
          <li key={option.id}>
            <div className="flex items-center gap-2.5 text-sm">
              <OptionIcon emoji={option.emoji} index={index} />
              <span className="min-w-0 flex-1 truncate font-semibold">{option.label}</span>
              {winner && <Trophy className="size-4 text-warning" aria-label="Meiste Stimmen" />}
              <span className="text-muted tabular-nums">
                {formatNumber(option.votes ?? 0)} {option.votes === 1 ? "Stimme" : "Stimmen"} · {option.percent ?? 0} %
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
              <div
                className={cn("h-full rounded-full transition-[width]", winner ? "bg-warning" : "bg-primary")}
                style={{ width: `${option.percent ?? 0}%` }}
              />
            </div>
            {showVoters && option.voters && option.voters.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {option.voters.map((voter) => (
                  <span
                    key={voter.id}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 pr-2.5 pl-1 text-xs font-medium"
                  >
                    {voter.avatarUrl ? (
                      <img src={voter.avatarUrl} alt="" className="size-5 rounded-full" />
                    ) : (
                      <span className="size-5 rounded-full bg-surface-3" />
                    )}
                    {voter.name ?? `Unbekannt (${voter.id})`}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
