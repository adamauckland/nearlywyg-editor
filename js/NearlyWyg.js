function NearlyWygEditor(styleSelector, textArea, copyArea, buttonBlock) {
    var styleBlock,
        elementBlock, 
        $styleSelector,
        $textArea,
        $copyArea,
        $buttonBlock,
        $latestElement = null,
        cancelButtonEvent = false,
        nearlyWygEditor = this;
    
    
    this.onChangeFunctions = [];
    
    this.onChange = function(fn) {
        this.onChangeFunctions.push(fn);
    };
    
    this.fireOnChange = function() {
        for(var i=0; i< this.onChangeFunctions.length; i++) {
            this.onChangeFunctions[i]();
        }
    };
    
    
    function generateHtmlForContent(elementType, content) {
        var $rootElement,
            $itemElement;
        
        $rootElement = $('<'.concat(elementType).concat('/>'));
          
        switch(elementType) {
            case 'ol':
            case 'ul':
                // split content into carriage return separated items, then
                // add as list items
                var splitItem = content.split('\n');
                
                for(var i=0; i<splitItem.length; i++) {
                    $itemElement = $('<li />').text(splitItem[i]);
                    $rootElement.append($itemElement);
                }
                break;
            
            case 'img':
                $rootElement.attr('src', content.replace(/ /g, ''));
                break;
            
            default:
                buildHtml = $rootElement.text(content);
                buildHtml.html(buildHtml.html().replace(/\n/g, '<br/>'));
                break;
        }

        return $rootElement;
    }
    
    
    function generateContentForHtml($element) {
        var elementType = $element.prop('tagName').toLowerCase(),
            content,
            buildItems;
        
        switch (elementType) {
            case 'ol':
            case 'ul':
                buildItems = [];
                $element.find('li').each(function(index, element) {
                    var $liElement = $(element);
                    buildItems.push($liElement.text());
                });
                
                content = buildItems.join('\n');
                break;
        
            case 'img':
                content = $element.attr('src');
                break;
            
            default:
                content = $element.html().replace(/<br>/g, '\n');
        }
        
        return content;
    }
    
    
    function initialise() {
        $styleSelector = $(styleSelector);
        $textArea = $(textArea);
        $copyArea = $(copyArea);
        $buttonBlock = $(buttonBlock);
        
        styleBlock = new StyleBlock($styleSelector);
        elementBlock = new EditorBlock($textArea);
        
        elementBlock.styleBlock = styleBlock;
        styleBlock.elementBlock = elementBlock;
        
        if (!$buttonBlock.hasClass('hidden')) {
            $buttonBlock.addClass('hidden');
        }
        
        attachButtonClickHandlers();        
    }
    
    
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
            
            if ($buttonBlock.hasClass('hidden')) {
                $buttonBlock.removeClass('hidden');
            }
        });
        
        
        function resetEditing() {
            self.element.val('');
            self.styleBlock.resetStyleBlock();                    
            self.newElement = true;
            
            if (!$buttonBlock.hasClass('hidden')) {
                $buttonBlock.addClass('hidden');
            }
        }
        
        
        function startEditingBlock(blockElement, newElementType) {
            var elementText;
            
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
            
            elementText = generateContentForHtml(blockElement);
            
            self.element.val(elementText);        
            self.element.focus();
            
            if ($buttonBlock.hasClass('hidden')) {
                $buttonBlock.removeClass('hidden');
            }
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
        
        
        this.updateCopyNewItem = function() {
            var newElementType,
                $newElement;
            
            newElementType = self.styleBlock.getElementType();
            $newElement = generateHtmlForContent(newElementType, self.element.val());
            
            attachBlockClickHandlers($newElement, newElementType);
            
            $copyArea.append($newElement);
            
            $latestElement = $newElement;
        };
        
        
        this.updateCopyExistingItem = function() {
            var newElementType,
                $newReplaceElement;
                
            newElementType = self.styleBlock.getElementType();          
            $newReplaceElement = generateHtmlForContent(newElementType, self.element.val());
            
            attachBlockClickHandlers($newReplaceElement, newElementType);            
            self.newElement.replaceWith($newReplaceElement);            
            $latestElement = $newReplaceElement;
        };
        
        
        function blurFromElement() {
            var stripText;
            
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
            
            stripText = self.element.val().replace(/ /g, '').replace(/\n/g, '');
            if (stripText !== '') {
                if (self.newElement === true) {
                    self.updateCopyNewItem();
                } else {
                    self.updateCopyExistingItem();
                }
            } else {
                // if we're editing an existing item and the user has cleared the item,
                // delete it
                if (self.newElement !== true) {
                    self.newElement.remove();
                    $latestElement = null;
                }
            }
            
            cancelSorting();
            resetEditing();
            
            nearlyWygEditor.fireOnChange();
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
                
                // change existing content
                if (self.elementBlock.newElement !== true) {
                    //self.elementBlock.updateCopyExistingItem();
                }
                
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
    
    initialise();
}
