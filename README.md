## MendixReactDnD
Wrapper for [react-dnd](https://react-dnd.github.io/react-dnd/about) to provide drag/drop functionality using the pluggable widget architecture.

## Features
- Drag items from lists and drop them on other page elements.
- Reorder items in a list by dragging them.
- Configure for each item whether it is draggable, or a drop target, or both.
- For drop targets, configure which items may be dropped onto it.
- Position images on a floorplan or other background.
- Scroll the background to a giving position to move an image into view.
- Rotate images by dragging a rotation handle.
- Default styling to indicate valid and invalid drop targets.
- Optionally apply a shadow effect to items while they are dragged.

## Not for the faint hearted!
This is **not** an easy widget to work with! Take your time when you want to use it. The result is well worth the effort!

Testdrive the sample/demo project! It is a great starting point and contains a lot of stuff you can copy and adjust to your needs.

Read the docs!

## What's with all the datasource containers?
This has to do with how React works, the framework underneath the Mendix client and the modern pluggable widgets. React does not allow you to just target any element on the page. There are tricks to achieve that but that breaks several rules and conventions. First and foremost, a component has control on the elements it renders and any components it renders. That is why React DnD libraries always come with some top level component that provides the drag/drop canvas and needs to contain the draggables and drop targets. Of course, these can be nested in any other element and component.

As a result, the Mendix widget must take a similar approach. It renders the top level component and in that all the datasource containers you define in Mendix.

## Usage

Take the sample project as a starting point!

- Define IDs for the various containers using an enumeration.
- The widget needs a context object, described in more detail separately
- Datasource containers currently only work with lists. However, nothing stops you from creating a datasource microflow that returns a single object in a list, mimicking a single object datasource.
- Create a microflow that handles the drop.
- Optionally configure an onClick action.

## Drag/drop backend
The react-dnd library can use the HTML5 and touch backends for drag/drop operations. The default is to use the HTML5 backend.

The basic rule: Use the HTML5 backend for laptops and desktops, use the touch backend for tablets and smartphones. 

However, there are many devices that can be used in different ways:
- Surface devices that can be used with a mouse or as tablet.
- Many laptops have a touch screen
- Separate touch screen attached to a laptop or desktop
- Windows has a tablet mode.

The widget makes no attempt to guess the device type. It is up to you to choose the right backend for your application.

Be sure to test this with the actual devices! 

## The context object
All event handling is done by setting values on the context object.

| Attribute               | Type        | Drop | Drop with position | Remarks
|-------------------------|-------------|:----:|:------------------:|---------
| Container ID            | Enumeration | Req. | Req.               | Container ID of the dragged item
| Client X                | Integer     |      | Req.               | Client (mouse) X position for the event.
| Client Y                | Integer     |      | Req.               | Client (mouse) Y position for the event.
| Offset X                | Integer     |      | Req.               | Offset X position for the event. Relative from the element.
| Offset Y                | Integer     |      | Req.               | Offset Y position for the event. Relative from the element.
| Dragged difference X    | Integer     |      | Opt.               | Dragged difference for the X offset.
| Dragged difference Y    | Integer     |      | Opt.               | Dragged difference for the Y offset.
| Object GUID             | String      | Req. | Req.               | When an object was clicked or dragged, contains the GUID of the dragged object
| Drop target ID          | Enumeration | Req. | Req.               | When an object was dragged onto another object, contains the container ID of the drop target
| GUID of drop target     | String      | Req. | Req.               | When an object was dragged onto another object, contains the GUID of the drop target
| New rotation            | Integer     |      | Req.               | New rotation for the object. Required when allowing users to rotate items.
| Data change date        | Date        | Req. | Req.               | Update the date in your logic to make the widget update the table. (Pluggable widgets are rendered VERY often!)
| Use touch backend       | Boolean     |      |                    | When set to true, the touch backend is used for drag/drop operations. For tablets and smartphones.
| Zoom %                  | Integer     |      |                    | Zoom percentage, when set, will be used to correct X/Y offset for the zoom percentage
| Adjust offset           | Boolean     |      |                    | Adjust offset for zoom position. Turn off if you want to make the calculation yourself.
| Snap to grid            | Boolean     |      |                    | Snap to grid while dragging
| Snap to size            | Integer     |      |                    | Step for the snap to grid feature, can be configured separately from the visible grid size, configured for each container.
| Snap to rotate          | Boolean     |      |                    | Rotate along rotation drag degrees
| Rotation drag degrees   | Integer     |      |                    | Number of degrees to rotate while dragging the rotation handle.
| Rotation button degrees | Integer     |      |                    | Number of degrees to rotate when clicking a rotation button.
| Add to rotation         | Boolean     |      |                    | When true, add the rotation button degrees value to the current rotation. When false, rotate to the next or previous value.
| shift key               | Boolean     |      |                    | Whether the shift key was held during an onclick event. (Not applicable for drop events)
| ctrl key                | Boolean     |      |                    | Whether the ctrl key was held during an onclick event. (Not applicable for drop events)
| alt key                 | Boolean     |      |                    | Whether the alt key was held during an onclick event. (Not applicable for drop events)
| Is right click          | Boolean     |      |                    | Whether the click event is a right click. (Not applicable for drop events)
| Selected marker GUIDs   | String      |      | Opt.               | The selected marker(s). Comma separated list of GUIDs.
| Selected marker count   | Integer     |      | Opt.               | Optional. Number of selected markers. Only relevant when multiselect of markers is allowed at one or more containers.
| Scroll to row           | Integer     |      | Opt.               | Set the row number of the cell to scroll. See below
| Scroll to column        | Integer     |      | Opt.               | Set the column number of the cell to scroll
| Scroll to X             | Integer     |      | Opt.               | The X position to scroll to
| Scroll to Y             | Integer     |      | Opt.               | The Y position to scroll to

## Events

| Action                  | Drop | Drop with position | Remarks
|-------------------------|:----:|:------------------:|---------
| On click action         |      | Opt.               | Action to call after an item was clicked. See below.
| On drop action          | Req. | Req.               | Action to call after an item was dropped.
| On rotate action        |      | Opt.               | On rotate action. Required when allowing users to rotate items.
| On drag to select       |      | Opt.               | Action to call after user selects multiple markers by dragging a selection area. Use this to update the list of selected markers.

### The Data changed date attribute
Pluggable widgets are rendered **really** often due to the way React and Mendix work. Clicking buttons, conditional visibility elsewhere on the page, changing the context object or opening a popup are examples. 

To improve performance, the widget will only reload the data from the datasource when the value of the data changed date attribute changes. So whenever you want the widget to refresh, set the attribute to current date/time in your microflow. When the date did not change, the widget will just render the data loaded in a previous render.

Be sure to only commit the context object with the data changed date with refresh in client. The datasources will get the other data. Refreshing objects retrieved through a datasource can trigger additional server roundtrips. 

### Dragged difference
When dragging a parent marker, you will need to adjust any related markers as well if you want to keep them together. The widget will do this while dragging the parent around but you will need to persist the new position for the child markers yourself.

The same applies to multi selection. When multiple markers are selected, the widget will report the new position for the marker that was dragged. The GUIDs of the other selected markers are passed in the selection context attribute.

## Return on click events?
Returning on click events from the widget only makes sense when positioning items on a background. When dropping without position, a container with an onClick action is easier. The on click event of the widget allows you to capture the exact click coordinate on the container.

## Inspecting the contents
Because the widget captures right-click events, inspecting an element by right-clicking it no longer works. The browser inspector can also directly inspect elements. The example is for Chrome. The little arrow icon in the top left of the inspector pane allows you to target elements on the page.

![Inspect element 1](/doc-images/InspectElement1.jpg "Inspect element 1")

![Inspect element 2](/doc-images/InspectElement2.jpg "Inspect element 2")


## Containers
The widget allows you to choose where to put each container by setting a row and column number. The result is a grid with your containers. Note that the widget does not contain additional empty cells when you leave gaps in the column numbers. Note that it is perfectly fine to place multiple containers in the same row/column combination. This also allows a header and the list to be styled as one.

### General container configuration

| Property             | Type        | Remarks
|----------------------|-------------|---------
| Container ID         | String      | Expression, usually toString() of an enumeration value you defined earlier. This value will be used in the events
| Row number           | Integer     | Row number, numbering starts at 1
| Column number        | Integer     | Column number, numbering starts at 1
| DnD type             | Enumeration | Drag/drop type.
| Allow selection      | Enumeration | Whether markers may be selected. For single selection, the marker will be selected and the onClick action will be called.
| Return OnClick       | Boolean     | Whether OnClick events should be returned for the container.
| Allow drag to select | Boolean     | Whether the user can drag a selection area to select multiple markers. Only makes sense when multi-select is allowed on items in the same row/column combination.
| Accepts IDs          | String      | For drop targets. The IDs of containers for which items may be dropped onto this container. Usually toString() of an enumeration value you defined earlier. Separate multiple values using a comma (,).

### The datasource for the container

| Property            | Type        | Req. | Remarks
|---------------------|-------------|:----:|---------
| Data source         |             | Y    | The datasource for the item(s) in the container.
| Content             |             | Y    | The content to render for each item. Optional! The widget can render images, see below
| Disable drag        | Boolean     |      | When dragging is possible, use this to (temporarily) disable dragging of this item.
| Name                | String      |      | Name attribute. When set, will render a data-name attribute with the value on the item element.
| Marker class        | String      |      | Optional, value will be added to the CSS class of the marker
| Child IDs           | String      |      | See below

Be careful when using attributes over long XPaths in a datasource. This could cause performance issues.

**IMPORTANT** Make sure any datasource microflow has the context object as parameter and any XPath ties to the context object as well. Otherwise, the contents may not refresh properly.

#### Child IDs
Datasource items can be linked to a parent item. When dragging the parent, any child items will move along too.
Note that an item ID is just the GUID.

### Rendering items as an image
The widget can render items as image, allowing the user to rotate the image. Optionally, the image can resize along with the zoom percentage or keep its size. Examples: A marker on a floorplan should probably not scale so it remains visible when zooming out. Furniture placed on the floorplan should scale with the zoom percentage.

When X and Y offset are set, position absolute is also set on the item.

Use CommunityCommons.GetImageDimensions to save the image dimensions on your image objects. 

To create a sidebar with templates, use a separate container to show the template items. Mark these as template using the `Is template item` property and set the `maximum template width` property on them. This ensures that the template bar does not scale with the zoom factor and the items are not wider than the sidebar. If the item you create from the template will scale with the floorplan or background, set the value on the template as well. As a result, while dragging the template onto the background, the template will appear correctly sized for the current zoom level so it may be placed on the background correctly. 

| Property            | Type        | Req. | Remarks
|---------------------|-------------|:----:|---------
| Offset X            | Integer     |      | Offset X position for the item.
| Offset Y            | Integer     |      | Offset Y position for the item.
| Image URL           | String      | Y    | Image URL. Can be absolute, concatenated with Mendix remote URL when it does not start with http, should not start with / in that case.
| Image height        | Integer     | Y    | Image height, in pixels
| Image width         | Integer     | Y    | Image width, in pixels
| Scale image         | Boolean     |      | Scale image with the floorplan.
| Rotation            | Integer     |      | The current rotation of the image. Required when the user is allowed to rotate the image
| Allow rotate        | Boolean     |      | Whether user may rotate the image. Only when image is rendered. If true, a rotation handle will be shown when the user hovers over the image.
| Show grid           | Boolean     |      | Show a grid over this item
| Grid size           | Integer     |      | Size of a grid cell. Note that the snap to grid feature has a separate snap to size
| Is template item    | Boolean     |      | Is this a template to create items by dropping this one on the background?
| Max. template width | Integer     |      | Maximum width of the template item as shown in the sidebar.

### Styling the container and its items

The widget comes with defaults for the required classes but you're welcome to use your own. Just be sure you know what you're doing!

| Property            | Type        | Req. | Remarks
|---------------------|-------------|:----:|---------
| Container class     | String      |      | Additional class(es) to put on the container.
| Draggable class     | String      | Y    | Class to place on the draggable container 
| Dragging class      | String      | Y    | Class to place on the draggable container while dragging is active.  
| Drop target class   | String      | Y    | Class to place on the drop target container
| Can drop class      | String      | Y    | Class to place on the drop target container when a valid item is hovered over it 
| Invalid drop class  | String      | Y    | Class to place on the drop target container when an invalid item is hovered over it

The widget always drags a copy. Note that the draggable class applies to the original item, not the dragged copy. If you want to move an item on a canvas, the original item should probably be hidden. Use class `dragging-container-hidden` in such use cases. 

## Retrieving an object using its GUID
The widget uses GUIDs to indicate which object was dropped and where it is dropped. The demo project has Java action `MainModule.RetrieveObjectByGUID` which allows easy retrieval of an object by the GUID.

## Do not place the widget in a popup
This will not work very well and is not supported.

## Positioning images on a background.
The sample project has an example of positioning items on a floorplan. 

Take care when creating a palette from which the user can drag items onto the floorplan or canvas. If the item on the palette has different dimensions than the item on the floorplan it might not be positioned correctly.

If you allow items to be positioned on top of each other or overlapping in any way, be sure to make the items a drop target as well. Without this, items cannot be dropped close to each other or on top of each other.

### Prevent dropping outside the background image
The background image will resize according to the zoom level, so it may be smaller than the available space. The drop target is just a `div` so by default it will take all available space, allowing markers to be dropped outside the backgroud image. To prevent this, put a class similar to this one on your background container:

```
    div.widget-cell-content-container.floorplanContainer {
        display: inline-block;
    }
```

The demo app has this class applied to the background.

**Only put this class on the background container!** If this class is put on draggable items, these will not be positioned correctly anymore!

### Marker selection

The styling tab has additional options for marker selection, intended only for positioning items on a floorplan.

The selected marker GUIDs attribute can be used to set and get the selected markers.

As the markers are images with a position and size, drawing a border around them affects the layout. The default uses a 2 pixel border, so the border width property is set to 2. This is used when calculating the marker image properties.

### Snap to grid
The widget has a snap to grid feature, to prevent the user from having to drag and drop at an exact pixel position.

If it seems impossible to snap drop an item at the top-left corner of your background, make sure your background is positioned at a multiple of the snap to size used. So if your snap to size is 10 but the background is positoned at left=85, the snap to function will be off by 5. Note that layout grid and other containers may add padding as well. Inspect in the browser where necessary. This can be seen in the demo project: snap to sizes 5 and 10 work correctly but 15 and 20 make it impossible to position an item in the top/left corner or at the top of the background.  

### Show grid
For each datasource can be specified whether a grid should be shown. This is done at datasource level otherwise the grid would be shown across all containers where it should only be shown over the background.

### Scroll/Zoom to marker
Set the zoom percentage, scroll to row/column and X/Y position to scroll one of more markers into view. Be sure to set the values to `empty`, not zero, to prevent unwanted scroll actions from the widget. Best place to do that is when opening the page with the widget. The sample project does this.

Microflow `SUB_EditFloorplan_ZoomTo` in the sample project accepts a list of markers as parameter. It then calculates the zoom percentage and scroll to X/Y. You can copy this microflow to your own project and call it. Be sure to commit the context object yourself. The microflow does not commit the object in case other changes need to be made to the context object as well.

With complex pages, state update issuesmay occur, in that case commit the context object. This can be done using the `On scroll to handled action`. A simple `Save changes` is sufficient.

The scroll to can come too soon, in that case the content has not yet been rendered. This may happen when the page is opened with scroll to already set. So a delay is available, which can be configured using the `Scroll to delay` property. The default is zero.

## Styling
The widget is easy enough to style by setting a class on it in the widget properties and then apply styling by targeting the main widget using your class and overruling defaults. Also, the classes used for each container can be changed at the container definition.

An example of a page where available products can be dragged to include them.
![Screen copy](/doc-images/Screencopy1.png "Screen copy")

This is what the structure looks like:
![Widget DOM structure](/doc-images/WidgetDomStructure.png "Widget DOM structure")

Note that some details are left out for brevity, inspect the sample app in the browser for full details

The elements and classes involved that you can overrule to apply styling:

| Element                | Classes                 | Description
|------------------------|-------------------------|--------------
| Widget container       | widget-container        | The widget container. Any classes you put on the widget end up here
|                        | drag-shadow             | Add this class to the widget container to show a shadow while dragging
| Row                    | widget-row widget-row-x | Row container, row **x**
| Cell                   | widget-cell widget-cell-r**x**-c**y** | Cell at row `x` and column `y`
| Cell content container | widget-cell-content-container | Contains the contents rendered for a container
| Drop target container  | droptarget-container    | If container is a drop target
| Draggable container    | draggable-container     | If container is draggable
| Item container         | widget-cell-content-container-item | Contains rendered content for one datasource item
|                        | draggableItem           | Added if draggable
|                        | dropTarget              | Added if drop target

### Additional marker classes
When you want to put additional classes on a marker, without actually updating it, you can use this feature. The value of the property is a JSON array as a string:
```
[
    {
        "itemID": "<itemID1>",
        "classes": "myspecialclass"
    },
    {
        "itemID": "<itemID2>",
        "classes": "myspecialclass otherclass"
    }
]
```
Separate multiple clases using a space.
Note that an item ID is just the GUID. So you target any marker for that specific Mendix object. Usually just the one marker of course.

The demo project has an export mapping available to create the JSON data, you can of course also just piece it together as a string, choose what suits you best.

## The custom drag layer 
The custom drag layer is a layer above the normal render layer. Nothing fancy, just a div with a z-index spanning the viewport.

Any dragged item is rendered here, this is the copy that is being dragged. It is wrapped in a div with class `custom-draglayer-item`.

| Element                | Classes                 | Description
|------------------------|-------------------------|--------------
| Custom drag layer      | custom-draglayer        | Dragged items are rendered here
| Custom drag layer item | custom-draglayer-item   | Contains dragged item

To change the appearance of your item while it is dragged, use class `custom-draglayer-item` in your SASS file. For example, to remove the bottom border while the item is being dragged:

```
div.parent-child {
    div.custom-draglayer div.widget-cell-content-container-item {
        border-bottom: none;
    }
}
```
In this example class `parent-child` would be put on the widget in Studio Pro, to make sure only items dragged in that particular page are affected 

## Demo project
[Separate demo project in the appstore](https://marketplace.mendix.com/link/component/116649)

## Issues, suggestions and feature requests
[link to GitHub issues](https://github.com/Itvisors/mendix-ReactDnD/issues)
