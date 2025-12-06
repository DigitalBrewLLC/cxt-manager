"use strict";
/**
 * Core types for CxtManager - Git for AI Context
 */
Object.defineProperty(exports, "__esModule", { value: true });
var ContextSource;
(function (ContextSource) {
    ContextSource["AI"] = "ai";
    ContextSource["HUMAN"] = "human";
    ContextSource["CODE_TRIGGERED"] = "code-triggered";
    ContextSource["EXTERNAL"] = "external";
})(ContextSource || (ContextSource = {}));
var AlignmentStatus;
(function (AlignmentStatus) {
    AlignmentStatus["ALIGNED"] = "aligned";
    AlignmentStatus["WARNING"] = "warning";
    AlignmentStatus["CONFLICT"] = "conflict";
})(AlignmentStatus || (AlignmentStatus = {}));
var ContextStatus;
(function (ContextStatus) {
    ContextStatus["CLEAN"] = "clean";
    ContextStatus["MODIFIED"] = "modified";
    ContextStatus["NEW"] = "new";
    ContextStatus["DELETED"] = "deleted";
})(ContextStatus || (ContextStatus = {}));
//# sourceMappingURL=index.js.map