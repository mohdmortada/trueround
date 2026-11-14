import type * as React from 'react';
export type IconName = 'check' | 'clock' | 'shield' | 'ban' | 'home' | 'ladder' | 'card' | 'play' | 'calendar' | 'user' | 'lock' | 'scale' | 'whistle';
export type Status = 'neutral' | 'verified' | 'pending' | 'cleared' | 'suspended';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; size?: 'md' | 'sm'; block?: boolean; icon?: IconName }
export declare function Button(props: ButtonProps): React.ReactElement;
export interface BadgeProps { status?: Status; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;
export interface CornerTagProps { corner: 'red' | 'blue'; children?: React.ReactNode }
export declare function CornerTag(props: CornerTagProps): React.ReactElement;
export interface IconProps { name: IconName; size?: number; strokeWidth?: number; label?: string }
export declare function Icon(props: IconProps): React.ReactElement;
export interface ScorecardProps { red: string; blue: string; hideCorners?: boolean; judges: Array<Array<[number, number]>>; result?: { winner: 'red' | 'blue'; method: string; winnerName?: string }; verifiedBy?: string }
export declare function Scorecard(props: ScorecardProps): React.ReactElement;
export interface RecordProps { wins: number; losses: number; draws: number; size?: 'md' | 'sm' }
export declare function Record(props: RecordProps): React.ReactElement;
export interface LevelLadderProps { levels: string[]; current: number }
export declare function LevelLadder(props: LevelLadderProps): React.ReactElement;
export interface SkillMeterProps { skill: string; value: number; status?: 'verified' | 'pending' | 'neutral'; verifiedBy?: string; date?: string }
export declare function SkillMeter(props: SkillMeterProps): React.ReactElement;
export interface ClearanceCardProps { status: 'cleared' | 'pending' | 'suspended'; title?: string; until?: string; issuedBy?: string; children?: React.ReactNode }
export declare function ClearanceCard(props: ClearanceCardProps): React.ReactElement;
export interface AthleteCardProps { name: string; photo?: string; gym?: string; coach?: string; record?: { wins: number; losses: number; draws: number }; level?: string; weightClass?: string; nation?: string; verified?: boolean; corner?: 'red' | 'blue'; footer?: React.ReactNode }
export declare function AthleteCard(props: AthleteCardProps): React.ReactElement;
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; hint?: string; error?: string }
export declare function Field(props: FieldProps): React.ReactElement;
export interface ToggleProps { label: string; hint?: string; checked: boolean; onChange?: (next: boolean) => void; disabled?: boolean; id?: string }
export declare function Toggle(props: ToggleProps): React.ReactElement;
export interface BottomNavProps { items: Array<{ id: string; label: string; icon: IconName; badge?: string }>; active: string; onSelect?: (id: string) => void; label?: string }
export declare function BottomNav(props: BottomNavProps): React.ReactElement;
declare global { interface Window { TrueRound: { Button: typeof Button; Badge: typeof Badge; CornerTag: typeof CornerTag; Icon: typeof Icon; Scorecard: typeof Scorecard; Record: typeof Record; LevelLadder: typeof LevelLadder; SkillMeter: typeof SkillMeter; ClearanceCard: typeof ClearanceCard; AthleteCard: typeof AthleteCard; Field: typeof Field; Toggle: typeof Toggle; BottomNav: typeof BottomNav; icons: IconName[] } } }
