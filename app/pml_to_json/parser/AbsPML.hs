module AbsPML where

-- Haskell module generated by the BNF converter


newtype STRING = STRING String deriving (Eq,Ord,Show)
newtype ID = ID String deriving (Eq,Ord,Show)
newtype NUMBER = NUMBER String deriving (Eq,Ord,Show)
data PROCESS =
   Process ID [PRIM]
  deriving (Eq,Ord,Show)

data PRIM =
   PrimBr OPTNM [PRIM]
 | PrimSeln OPTNM [PRIM]
 | PrimIter OPTNM [PRIM]
 | PrimSeq OPTNM [PRIM]
 | PrimTask OPTNM [PRIM]
 | PrimAct ID OPTYP [SPEC]
  deriving (Eq,Ord,Show)

data OPTNM =
   OpNmNull
 | OpNmId ID
  deriving (Eq,Ord,Show)

data OPTYP =
   OptNull
 | OptMan
 | OptExec
  deriving (Eq,Ord,Show)

data SPEC =
   SpecProv EXPR
 | SpecReqs EXPR
 | SpecAgent EXPR
 | SpecScript STRING
 | SpecTool STRING
  deriving (Eq,Ord,Show)

data EXPR =
   DisjExpr EXPR EXPR
 | ConjExpr EXPR EXPR
 | Str STRING
 | RelEq VALEXPR VALEXPR
 | RelNe VALEXPR VALEXPR
 | RelLt VALEXPR VALEXPR
 | RelGt VALEXPR VALEXPR
 | RelLe VALEXPR VALEXPR
 | RelGe VALEXPR VALEXPR
 | RelVeq VAREXPR VAREXPR
 | RelVne VAREXPR VAREXPR
 | PrimVar VAREXPR
 | PrimAttr ATTREXPR
 | PrimNot EXPR
  deriving (Eq,Ord,Show)

data VAREXPR =
   VarId ID
 | VarPar ID
 | VarMore ID VAREXPR
  deriving (Eq,Ord,Show)

data ATTREXPR =
   Attr VAREXPR ID
  deriving (Eq,Ord,Show)

data VALEXPR =
   ValAttr ATTREXPR
 | ValString STRING
 | ValNum NUMBER
  deriving (Eq,Ord,Show)

