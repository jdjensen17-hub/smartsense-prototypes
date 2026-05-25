export declare const buildMapForTrees: <T>(treeIds: string[], build: (treeId: string) => T) => {
    [treeId: string]: T;
};
export declare const getDocument: () => Document | undefined;
