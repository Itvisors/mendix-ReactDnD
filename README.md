## MendixReactDnD
Wrapper for [react-dnd](https://react-dnd.github.io/react-dnd/about) to provide drag/drop functionality using the pluggable widget architecture.

## Features
- Drag items from lists and drop them on other page elements
- Reorder items in a list by dragging them around
- Configure for each item whether it is draggable, or a drop target, or both
- For drop targets, configure which items may be dropped onto it.
- Position images on a floorplan or other background
- Rotate images by dragging a rotation handle
- Default styling to indicate valid and invalid drop targets
- Optionally apply a shadow effect to items while they are dragged 

## Usage
[step by step instructions]

## Not for the faint hearted!
This is **NOT** an easy widget to work with! Take your time when you want to use it.

Testdrive the sample project!

Read the docs!

## What's with all the datasource containers?
This has to do with how React works, the framework underneath the Mendix client and the modern pluggable widgets. React does not allow you to just target any element on the page. There are tricks to achieve that but that breaks several rules and conventions. First and foremost, a component has control on the elements it renders and any components it renders. That is why React DnD libraries always come with some top level component that provides the drag/drop canvas and needs to contain the draggables and drop targets. Of course, these can be nested in any other element and component.

As a result, the Mendix widget must take a similar approach. It renders the top level component and in that all the datasource containers you define in Mendix.

## Do not place the widget in a popup
This will not work very well and is not supported.

## Positioning images on a background.
The sample project has an example of positioning items on a floorplan. 

Take care when creating a palette from which the user can drag items onto the floorplan or canvas. If the item on the palette has different dimensions than the item on the floorplan it might not be positioned correctly.


## Demo project
[link to sandbox]

## Issues, suggestions and feature requests
[link to GitHub issues](https://github.com/Itvisors/mendix-ReactDnD/issues)

## Development and contribution
[specify contribute]
