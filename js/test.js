function NearlyWygEditor(styleSelector, textArea, copyArea, buttonBlock) {
    var styleBlock = new StyleBlock($(styleSelector)),
        elementBlock = new EditorBlock($(textArea)),
        $copyArea = $(copyArea);
        $buttonBlock = $(buttonBlock),
        $latestElement = null,
        cancelButtonEvent = false;
    
    elementBlock.styleBlock = styleBlock;
    styleBlock.elementBlock = elementBlock;
    
    $buttonBlock.hide();
    
    attachButtonClickHandlers();
    
    
    function attachButtonClickHandlers() {
        $buttonBlock.find('#cancelButton').click(function() {
            cancelButtonEvent = true;
        });    
    }
    
    
    function cancelSorting() {
        try {
            $copyArea.sortable('disable');    
        } catch(e) {
        
        }
    }

    
    function EditorBlock(element) {        
        this.element = element;
        this.newElement = true;
        this.blurTimer = null;
        
        var self = this;
        
        this.element.bind('focus', function() {
            self.styleBlock.element.show();
            $buttonBlock.show();
        });
        
        
        function resetEditing() {
            self.element.val('');
            self.styleBlock.resetStyleBlock();                    
            self.newElement = true;
            $buttonBlock.hide();
        }
        
        
        function startEditingBlock(blockElement, newElementType) {
            if (self.newElement !== true) {
                if (self.newElement.hasClass('editing')) {                
                    self.newElement.removeClass('editing');
                }
            }
            
            try {
                $copyArea.sortable('enable');    
            } catch(e) {
                $copyArea.sortable();
            }
            
            blockElement.addClass('editing');
            
            self.styleBlock.selectStyleBlock(newElementType);
            self.newElementType = newElementType;
            self.newElement = blockElement;
            
            var elementText = blockElement.html();
            elementText = elementText.replace(/<br>/g, '\n');
            
            self.element.val(elementText);        
            self.element.focus();
            
            $buttonBlock.show();
        }
        
        
        function attachBlockClickHandlers(blockElement, newElementType) {
            blockElement.bind('click', function() {
                if (blockElement.hasClass('editing')) {
                    blockElement.removeClass('editing');
                    cancelSorting();
                    resetEditing();
                    return false;
                }
                
                window.setTimeout(function() {
                    startEditingBlock(blockElement, newElementType);
                }, 200);
            });
        }
        
        
        function blurFromElement() {
            var newElementType,
                newVal,
                newHtml,
                stripText,
                $newElement,
                $newReplaceHtml,
                $newReplaceElement;
            
            if (cancelButtonEvent === true) {
                cancelButtonEvent = false;
                
                if (self.newElement !== true) {
                    console.log('Still has new element');
                    
                    if (self.newElement.hasClass('editing')) {                
                        console.log('Removing editing class');
                        
                        self.newElement.removeClass('editing');
                    }
                }
                
                cancelSorting();
                resetEditing();
                
                return; 
            }
            
            /// new element, create another item
            if (self.newElement === true) {
                stripText = self.element.val().replace(/ /g,'');
                
                if (stripText !== '') {                
                    newElementType = self.styleBlock.getElementType(); //self.styleBlock.element.find('*[data-selected=true]').attr('data-element');
                    newVal = self.element.val().replace(/\n/g, '<br/>');
                    newHtml = '<'.concat(newElementType).concat('>').concat(newVal).concat('</').concat(newElementType).concat('>');
                    $newElement = $(newHtml);
                    
                    attachBlockClickHandlers($newElement, newElementType);
                    
                    $copyArea.append($newElement);
                    
                    $latestElement = $newElement;
                }
            } else {
                stripText = self.element.val().replace(/ /g,'');
                
                if (stripText !== '') {                        
                    newElementType = self.styleBlock.getElementType();            
                    newVal = self.element.val().replace(/\n/g, '<br/>');          
                    newReplaceHtml = '<'.concat(newElementType).concat('>').concat(newVal).concat('</').concat(newElementType).concat('>');
                    
                    self.newElement.removeClass('editing');
                    
                    $newReplaceElement = $(newReplaceHtml);
                    
                    attachBlockClickHandlers($newReplaceElement, newElementType);
                    
                    self.newElement.replaceWith($newReplaceElement);
                    
                    $latestElement = $newReplaceElement;
                } else {
                    self.newElement.remove();
                    
                    $latestElement = null;
                }
                console.log('new html' + newReplaceHtml);
            }
            
            cancelSorting();
            resetEditing();
        }
        
        
        this.element.bind('blur', function() {
            self.blurTimer = window.setTimeout(blurFromElement, 200);
        });
    }
    
    
    
    
    function StyleBlock(element) {
        var self = this,
            showStyles = false;
        
        this.element = element;
        
        function unDataSelect() {
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                $element.attr('data-selected', 'false');
            });
        }
        
        
        this.getElementType = function() {
            var elementTypeReturn = 'p';
            
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                if ($element.attr('data-selected') === 'true') {
                    console.log('returning ' + $element.attr('data-element'))
                    elementTypeReturn = $element.attr('data-element');
                }
            });
            
            return elementTypeReturn;
        };
        
        
        this.selectStyleBlock = function(elementType) {
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                if ($element.attr('data-element') === elementType) {
                    $element.attr('data-selected', 'true');
                } else {
                    $element.attr('data-selected', 'false');   
                }
            });
            collapseMenu();
        };
        
        
        this.resetStyleBlock = function() {
            unDataSelect();
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                if ($element.attr('data-default') === 'true') {
                    $element.attr('data-selected', 'true');
                }
            });
            collapseMenu();
        };
        
        
        function liClick() {
            if (showStyles === false) {
                console.log('Showing styles');
                
                if (self.elementBlock.blurTimer !== null) {
                    window.clearTimeout(self.elementBlock.blurTimer);
                }
                
                self.element.find('li').each(function(index, element) {
                    $(element).show();
                });
                
                showStyles = true;
            } else {
                unDataSelect();
                $(this).attr('data-selected', 'true');
                collapseMenu();
                showStyles = false;
                
                self.elementBlock.element.focus();
            }
        }
        
        
        function collapseMenu() {
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                
                if ($element.attr('data-selected') === 'false') {
                    $element.hide();
                } else {
                    $element.show();
                }
            });
        }
        
        
        function bindClickHandlers() {
            self.element.find('li').each(function(index, element) {
                var $element = $(element);
                $element.click(liClick);
            });    
        }
        
        bindClickHandlers();
        collapseMenu();    
    }
}
