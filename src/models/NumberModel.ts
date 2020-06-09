interface NumberKey {
    testNumberKey: number;
}

export interface TestNumber extends NumberKey {
    testNumber: string;
    id: string;
    certLetter: string;
    sequenceNumber: string;
}

export interface TrailerId extends NumberKey {
    trailerId: string;
    trailerLetter: string;
    sequenceNumber: number;
}

export interface SystemNumber extends NumberKey {
    systemNumber: string;
}

export interface PlateSerialNumber extends NumberKey {
    plateSerialNumber: string;
}
