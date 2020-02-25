export interface TestNumber {
    testNumberKey: number;
    testNumber: string;
    id: string;
    certLetter: string;
    sequenceNumber: string;
}

export interface TrailerId {
    trailerId: string;
    trailerLetter: string;
    sequenceNumber: number;
    testNumberKey: number;
}
