import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface NewRepeater {
    status: Status;
    dcsCode: string;
    coverageDescription: string;
    city: string;
    toneMode: string;
    submittedBy: string;
    offset: number;
    callSign: string;
    zipCode: string;
    state: string;
    sponsor: string;
    autopatchInfo: string;
    frequency: number;
    operationalNotes: string;
    linkInfo: string;
    ctcssTone: string;
}
export type Time = bigint;
export interface Repeater {
    id: bigint;
    status: Status;
    dcsCode: string;
    coverageDescription: string;
    city: string;
    toneMode: string;
    submittedBy: string;
    offset: number;
    submissionStatus: SubmissionStatus;
    callSign: string;
    zipCode: string;
    state: string;
    timestamp: Time;
    sponsor: string;
    autopatchInfo: string;
    frequency: number;
    operationalNotes: string;
    linkInfo: string;
    ctcssTone: string;
}
export interface UpdateRepeaterData {
    status?: Status;
    dcsCode?: string;
    coverageDescription?: string;
    city?: string;
    toneMode?: string;
    offset?: number;
    callSign?: string;
    zipCode?: string;
    state?: string;
    sponsor?: string;
    autopatchInfo?: string;
    frequency?: number;
    operationalNotes?: string;
    linkInfo?: string;
    ctcssTone?: string;
}
export interface UserProfile {
    bio: string;
    name: string;
    callSign: string;
}
export type Miles = bigint;
export enum Status {
    active = "active",
    inactive = "inactive"
}
export enum SubmissionStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFavorite(repeaterId: bigint): Promise<void>;
    addRepeater(data: NewRepeater): Promise<Repeater>;
    approveRepeater(repeaterId: bigint, passphrase: string, approve: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteRepeater(repeaterId: bigint, passphrase: string): Promise<void>;
    getApprovedCitiesByState(state: string): Promise<Array<string>>;
    getApprovedRepeaters(): Promise<Array<Repeater>>;
    getApprovedStates(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFavorites(user: Principal): Promise<Array<Repeater>>;
    getPendingRepeaters(): Promise<Array<Repeater>>;
    getRepeatersByCityAndState(state: string, city: string): Promise<Array<Repeater>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeFavorite(repeaterId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchByZipCode(zipCode: string, radius: Miles): Promise<Array<Repeater>>;
    updateRepeater(repeaterId: bigint, passphrase: string, data: UpdateRepeaterData): Promise<Repeater>;
}
