[DSpace ESLint plugins](../../../../lint/README.md) > [HTML rules](../index.md) > `dspace-angular-html/no-keydown-on-btn-disabled`
_______

An element with `dsBtnDisabled` must not carry its own `(keydown)` handler.
      Angular chains a template listener onto the directive's host listener for the same event instead of adding a second DOM listener, so the `stopImmediatePropagation()` in `BtnDisabledDirective` never reaches it and the handler runs even while the element is disabled.
      Put the handler on a wrapper element, or read the disabled state inside the handler.
      Key pseudo-events such as `(keydown.enter)` and global-target listeners such as `(document:keydown)` are not chained onto the host listener, so they are left alone.

_______

[Source code](../../../../lint/src/rules/html/no-keydown-on-btn-disabled.ts)



### Examples


#### Valid code
    
##### a disabled button without its own keydown handler
        
```html
<button [dsBtnDisabled]="isDisabled" (click)="submit()">Submit</button>
```
        
    
##### a keydown handler on an element without dsBtnDisabled
        
```html
<button (keydown)="onKeydown($event)">Submit</button>
```
        
    
##### a keydown handler on a wrapper around the disabled button
        
```html
<span (keydown)="onKeydown($event)"><button [dsBtnDisabled]="isDisabled">Submit</button></span>
```
        
    
##### a key pseudo-event is not chained onto the host listener, so it is still stopped
        
```html
<button [dsBtnDisabled]="isDisabled" (keydown.enter)="onEnter($event)">Submit</button>
```
        
    
##### a global-target keydown listener attaches to document, so it is never chained
        
```html
<button [dsBtnDisabled]="isDisabled" (document:keydown)="onKeydown($event)">Submit</button>
```
        
    
##### dsBtnDisabled named inside another attribute value
        
```html
<button (keydown)="log('dsBtnDisabled')">Submit</button>
```
        
    
##### a comparison operator in an attribute value does not end the tag
        
```html
<button [dsBtnDisabled]="page <= 1" (click)="goPrev()">Previous</button>
```
        
    



#### Invalid code 
    
##### a disabled button with its own keydown handler
        
```html
<button [dsBtnDisabled]="isDisabled" (keydown)="onKeydown($event)">Submit</button>

        

```
Will produce the following error(s):
```
This `(keydown)` handler runs even while `dsBtnDisabled` is true. Move it to a wrapper element, or check the disabled state inside the handler.
```
        
    
##### a disabled button with a comparison operator and a keydown handler
        
```html
<button [dsBtnDisabled]="page <= 1" (keydown)="onKeydown($event)">Previous</button>

        

```
Will produce the following error(s):
```
This `(keydown)` handler runs even while `dsBtnDisabled` is true. Move it to a wrapper element, or check the disabled state inside the handler.
```
        
    
##### a disabled element that is not a button
        
```html
<a [dsBtnDisabled]="isDisabled" (keydown)="onKeydown($event)">Next</a>

        

```
Will produce the following error(s):
```
This `(keydown)` handler runs even while `dsBtnDisabled` is true. Move it to a wrapper element, or check the disabled state inside the handler.
```
        
    

