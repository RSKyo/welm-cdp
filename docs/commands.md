# Input 编辑动作清单

用于 `input` 模块中需要传入编辑动作名称的场景。命令名保留原始拼写；需要某个动作时可直接在本页搜索。

> 这是浏览器编辑命令的参考清单。实际是否生效仍取决于页面、焦点位置、选区与当前浏览器环境。

## 对齐、段落与格式

`AlignCenter`、`AlignJustified`、`AlignLeft`、`AlignRight`、`BackColor`、`Bold`、`DefaultParagraphSeparator`、`FontName`、`FontSize`、`FontSizeDelta`、`ForeColor`、`FormatBlock`、`HiliteColor`、`Indent`、`InsertHorizontalRule`、`InsertOrderedList`、`InsertUnorderedList`、`Italic`、`JustifyCenter`、`JustifyFull`、`JustifyLeft`、`JustifyNone`、`JustifyRight`、`MakeTextWritingDirectionLeftToRight`、`MakeTextWritingDirectionNatural`、`MakeTextWritingDirectionRightToLeft`、`Outdent`、`RemoveFormat`、`Strikethrough`、`StyleWithCSS`、`Subscript`、`Superscript`、`Underline`、`Unscript`、`UseCSS`。

## 剪贴板与历史

`Copy`、`Cut`、`Paste`、`PasteAndMatchStyle`、`PasteGlobalSelection`、`Redo`、`Undo`、`Yank`、`YankAndSelect`。

## 插入与链接

`CreateLink`、`InsertBacktab`、`InsertHTML`、`InsertImage`、`InsertLineBreak`、`InsertNewline`、`InsertNewlineInQuotedContent`、`InsertParagraph`、`InsertTab`、`InsertText`、`Unlink`。

## 删除

`BackwardDelete`、`Delete`、`DeleteBackward`、`DeleteBackwardByDecomposingPreviousCharacter`、`DeleteForward`、`DeleteToBeginningOfLine`、`DeleteToBeginningOfParagraph`、`DeleteToEndOfLine`、`DeleteToEndOfParagraph`、`DeleteToMark`、`DeleteWordBackward`、`DeleteWordForward`、`ForwardDelete`。

## 光标移动与扩展选择

`MoveBackward`、`MoveBackwardAndModifySelection`、`MoveDown`、`MoveDownAndModifySelection`、`MoveForward`、`MoveForwardAndModifySelection`、`MoveLeft`、`MoveLeftAndModifySelection`、`MovePageDown`、`MovePageDownAndModifySelection`、`MovePageUp`、`MovePageUpAndModifySelection`、`MoveParagraphBackward`、`MoveParagraphBackwardAndModifySelection`、`MoveParagraphForward`、`MoveParagraphForwardAndModifySelection`、`MoveRight`、`MoveRightAndModifySelection`、`MoveToBeginningOfDocument`、`MoveToBeginningOfDocumentAndModifySelection`、`MoveToBeginningOfLine`、`MoveToBeginningOfLineAndModifySelection`、`MoveToBeginningOfParagraph`、`MoveToBeginningOfParagraphAndModifySelection`、`MoveToBeginningOfSentence`、`MoveToBeginningOfSentenceAndModifySelection`、`MoveToEndOfDocument`、`MoveToEndOfDocumentAndModifySelection`、`MoveToEndOfLine`、`MoveToEndOfLineAndModifySelection`、`MoveToEndOfParagraph`、`MoveToEndOfParagraphAndModifySelection`、`MoveToEndOfSentence`、`MoveToEndOfSentenceAndModifySelection`、`MoveToLeftEndOfLine`、`MoveToLeftEndOfLineAndModifySelection`、`MoveToRightEndOfLine`、`MoveToRightEndOfLineAndModifySelection`、`MoveUp`、`MoveUpAndModifySelection`、`MoveWordBackward`、`MoveWordBackwardAndModifySelection`、`MoveWordForward`、`MoveWordForwardAndModifySelection`、`MoveWordLeft`、`MoveWordLeftAndModifySelection`、`MoveWordRight`、`MoveWordRightAndModifySelection`。

## 选择与标记

`SelectAll`、`SelectLine`、`SelectParagraph`、`SelectSentence`、`SelectToMark`、`SelectWord`、`SetMark`、`SwapWithMark`、`Unselect`。

## 滚动

`ScrollLineDown`、`ScrollLineUp`、`ScrollPageBackward`、`ScrollPageForward`、`ScrollToBeginningOfDocument`、`ScrollToEndOfDocument`。

## 其他

`FindString`、`IgnoreSpelling`、`OverWrite`、`Print`、`ToggleBold`、`ToggleItalic`、`ToggleUnderline`、`Transpose`。

## 完整原始清单（按字母顺序）

```text
AlignCenter
AlignJustified
AlignLeft
AlignRight
BackColor
BackwardDelete
Bold
Copy
CreateLink
Cut
DefaultParagraphSeparator
Delete
DeleteBackward
DeleteBackwardByDecomposingPreviousCharacter
DeleteForward
DeleteToBeginningOfLine
DeleteToBeginningOfParagraph
DeleteToEndOfLine
DeleteToEndOfParagraph
DeleteToMark
DeleteWordBackward
DeleteWordForward
FindString
FontName
FontSize
FontSizeDelta
ForeColor
FormatBlock
ForwardDelete
HiliteColor
IgnoreSpelling
Indent
InsertBacktab
InsertHorizontalRule
InsertHTML
InsertImage
InsertLineBreak
InsertNewline
InsertNewlineInQuotedContent
InsertOrderedList
InsertParagraph
InsertTab
InsertText
InsertUnorderedList
Italic
JustifyCenter
JustifyFull
JustifyLeft
JustifyNone
JustifyRight
MakeTextWritingDirectionLeftToRight
MakeTextWritingDirectionNatural
MakeTextWritingDirectionRightToLeft
MoveBackward
MoveBackwardAndModifySelection
MoveDown
MoveDownAndModifySelection
MoveForward
MoveForwardAndModifySelection
MoveLeft
MoveLeftAndModifySelection
MovePageDown
MovePageDownAndModifySelection
MovePageUp
MovePageUpAndModifySelection
MoveParagraphBackward
MoveParagraphBackwardAndModifySelection
MoveParagraphForward
MoveParagraphForwardAndModifySelection
MoveRight
MoveRightAndModifySelection
MoveToBeginningOfDocument
MoveToBeginningOfDocumentAndModifySelection
MoveToBeginningOfLine
MoveToBeginningOfLineAndModifySelection
MoveToBeginningOfParagraph
MoveToBeginningOfParagraphAndModifySelection
MoveToBeginningOfSentence
MoveToBeginningOfSentenceAndModifySelection
MoveToEndOfDocument
MoveToEndOfDocumentAndModifySelection
MoveToEndOfLine
MoveToEndOfLineAndModifySelection
MoveToEndOfParagraph
MoveToEndOfParagraphAndModifySelection
MoveToEndOfSentence
MoveToEndOfSentenceAndModifySelection
MoveToLeftEndOfLine
MoveToLeftEndOfLineAndModifySelection
MoveToRightEndOfLine
MoveToRightEndOfLineAndModifySelection
MoveUp
MoveUpAndModifySelection
MoveWordBackward
MoveWordBackwardAndModifySelection
MoveWordForward
MoveWordForwardAndModifySelection
MoveWordLeft
MoveWordLeftAndModifySelection
MoveWordRight
MoveWordRightAndModifySelection
Outdent
OverWrite
Paste
PasteAndMatchStyle
PasteGlobalSelection
Print
Redo
RemoveFormat
ScrollLineDown
ScrollLineUp
ScrollPageBackward
ScrollPageForward
ScrollToBeginningOfDocument
ScrollToEndOfDocument
SelectAll
SelectLine
SelectParagraph
SelectSentence
SelectToMark
SelectWord
SetMark
Strikethrough
StyleWithCSS
Subscript
Superscript
SwapWithMark
ToggleBold
ToggleItalic
ToggleUnderline
Transpose
Underline
Undo
Unlink
Unscript
Unselect
UseCSS
Yank
YankAndSelect
```