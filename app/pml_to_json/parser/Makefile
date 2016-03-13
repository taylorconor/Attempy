all:
	happy -gca ParPML.y
	alex -g LexPML.x
	latex DocPML.tex; dvips DocPML.dvi -o DocPML.ps
	ghc --make TestPML.hs -o TestPML
clean:
	-rm -f *.log *.aux *.hi *.o *.dvi
	-rm -f DocPML.ps
distclean: clean
	-rm -f DocPML.* LexPML.* ParPML.* LayoutPML.* SkelPML.* PrintPML.* TestPML.* AbsPML.* TestPML ErrM.* SharedString.* PML.dtd XMLPML.* Makefile*

