## MendixReactDnD
Wrapper for [react-dnd](https://react-dnd.github.io/react-dnd/about) to provide drag/drop functionality using the pluggable widget architecture.

## Features
- Drag items from lists and drop them on other page elements
- Reorder items in a list by dragging them
- Configure for each item whether it is draggable, or a drop target, or both
- For drop targets, configure which items may be dropped onto it.
- Position images on a floorplan or other background
- Rotate images by dragging a rotation handle
- Default styling to indicate valid and invalid drop targets
- Optionally apply a shadow effect to items while they are dragged 

## Not for the faint hearted!
This is **not** an easy widget to work with! Take your time when you want to use it.

Testdrive the sample/demo project!

Read the docs!

## What's with all the datasource containers?
This has to do with how React works, the framework underneath the Mendix client and the modern pluggable widgets. React does not allow you to just target any element on the page. There are tricks to achieve that but that breaks several rules and conventions. First and foremost, a component has control on the elements it renders and any components it renders. That is why React DnD libraries always come with some top level component that provides the drag/drop canvas and needs to contain the draggables and drop targets. Of course, these can be nested in any other element and component.

As a result, the Mendix widget must take a similar approach. It renders the top level component and in that all the datasource containers you define in Mendix.

## Usage
- Define IDs for the various containers using an enumeration.
- The widget needs a context object, described in more detail separately
- Datasource containers currently only work with lists. However, nothing stops you from creating a datasource microflow that returns a single object in a list, mimicking a single object datasource. The demo project has examples.
- Create a microflow that handles the drop.
- Optionally configure an onClick action.

## The context object
All event handling is done by setting values on the context object, mainly because changing datasource objects in the widget is not supported yet

| Attribute           | Type        | Drop | Drop with position | Remarks
|---------------------|-------------|:----:|:------------------:|---------
| Container ID        | Enumeration | Req. | Req.               | Container ID of the dragged item
| Client X            | Integer     |      | Req.               | Client (mouse) X position for the event.
| Client Y            | Integer     |      | Req.               | Client (mouse) Y position for the event.
| Offset X            | Integer     |      | Req.               | Offset X position for the event. Relative from the element.
| Offset Y            | Integer     |      | Req.               | Offset Y position for the event. Relative from the element.
| Object GUID         | String      | Req. | Req.               | When an object was clicked or dragged, contains the GUID of the dragged object
| Drop target ID      | Enumeration | Req. | Req.               | When an object was dragged onto another object, contains the container ID of the drop target
| GUID of drop target | String      | Req. | Req.               | When an object was dragged onto another object, contains the GUID of the drop target
| New rotation        | Integer     |      | Req.               | New rotation for the object. Required when allowing users to rotate items.
| On click action     | Action      |      | Opt.               | Action to call after an item was clicked. Only makes sense when positioning items on a background. When dropping without position, a container with an onClick action is easier.

## Retrieving an object using its GUID
The widget uses GUIDs to indicate which object was dropped and where it is dropped. The demo project has Java action `MainModule.RetrieveObjectByGUID` which allows easy retrieval of an object by a GUID.

## Do not place the widget in a popup
This will not work very well and is not supported.

## Positioning images on a background.
The sample project has an example of positioning items on a floorplan. 

Take care when creating a palette from which the user can drag items onto the floorplan or canvas. If the item on the palette has different dimensions than the item on the floorplan it might not be positioned correctly.

If you allow items to be positioned on top of each other or overlapping in any way, be sure to make the items a drop target as well. Without this, items cannot be dropped close to each other or on top of each other.

## Styling
The widget is easy enough to style by setting a class on it in the widget properties and then apply styling by targeting the main widget using your class and overruling defaults.

## Demo project
Separate demo project in the appstore

## Issues, suggestions and feature requests
[link to GitHub issues](https://github.com/Itvisors/mendix-ReactDnD/issues)
