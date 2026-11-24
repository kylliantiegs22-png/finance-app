import {
  Wallet, Percent, CreditCard, Receipt, PiggyBank, ChartPieSlice, ChartLineUp, House, Globe, Notebook, Buildings, Scales,
  Flame, Lightning, Snowflake, Target, CheckCircle, XCircle, Lock, Star, X, ArrowRight, BookOpen, ChartBar, User, Repeat,
  SpeakerHigh, SpeakerSlash, Moon, Sun, Bank, ShieldCheck, Coins, Lightbulb, ListChecks, Trophy, Sparkle, CalendarPlus,
  DownloadSimple, UploadSimple, Info, Question, Timer, Brain, ShoppingCart, Bell, Clock, Path, Vault, Handshake, Storefront,
  MagnifyingGlass, Crown, Medal, HandCoins, Calculator, Briefcase, Scroll, Rocket, ArrowCounterClockwise, CaretRight, Check,
  Lifebuoy, Leaf, TrendUp, Calendar, Barbell, SealCheck, Hourglass, Flag, Plant,
  type IconProps,
} from '@phosphor-icons/react';

const MAP = {
  Wallet, Percent, CreditCard, Receipt, PiggyBank, ChartPieSlice, ChartLineUp, House, Globe, Notebook, Buildings, Scales,
  Flame, Lightning, Snowflake, Target, CheckCircle, XCircle, Lock, Star, X, ArrowRight, BookOpen, ChartBar, User, Repeat,
  SpeakerHigh, SpeakerSlash, Moon, Sun, Bank, ShieldCheck, Coins, Lightbulb, ListChecks, Trophy, Sparkle, CalendarPlus,
  DownloadSimple, UploadSimple, Info, Question, Timer, Brain, ShoppingCart, Bell, Clock, Path, Vault, Handshake, Storefront,
  MagnifyingGlass, Crown, Medal, HandCoins, Calculator, Briefcase, Scroll, Rocket, ArrowCounterClockwise, CaretRight, Check,
  Lifebuoy, Leaf, TrendUp, Calendar, Barbell, SealCheck, Hourglass, Flag, Plant,
} as const;
export type IconName = keyof typeof MAP;

export function Icon({ name, ...p }: { name: string } & IconProps) {
  const C = MAP[name as IconName] ?? Sparkle;
  return <C aria-hidden="true" {...p} />;
}
export const iconNames = Object.keys(MAP);
