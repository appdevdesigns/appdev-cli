steal(
        // List your Page's dependencies here:
        'appdev/appdev.js'
        , 'bootstrap/css/bootstrap.min.css'
        , 'pages/<%= pageName %>/<%= pageName %>.css'
).then(
<%

var listControllers = [];

// compile list of dependent Controllers
for(var c in router.controllers) {
    listControllers.push("        '"+router.controllers[c]+"'");
}

// Add in dependent Models
for(var m in router.models) {
    listControllers.push("        '"+router.models[m]+"'");
}

// if nothing, then just display an example entry:
if (listControllers.length == 0) listControllers.push("//        'app/controllers/controller.js'");


%><%- listControllers.join(',\n') %>
).then(function(){

    // All dependencies loaded by now
    // Create your controllers here:

<% for (var s in router.setup ) {
        var model = router.setup[s].model;
        var controller = router.setup[s].controller;
        var divID = router.setup[s].divID;
        var viewName = router.setup[s].view_add;
 %>

    // Setup <%= controller.Class %>
    <% if (model) { %><%= model.Class %>.findAll({}, function(list) {
    <% } %>    var <%= controller.Var %>  = new <%= controller.Class %>('#<%= divID %>', {
    <% if (model) { %>            dataSource:list, <% } %>
                templateAdd:'<%= viewName %>'
        });
    <% if (model) { %>});  <% } %>

<% }  %>




//// This next step can be removed once we refactor Model objects
//// to communicate across socket.io instead of ajax.
<%
// Add in model calls across the socket.io channel
for(var m in router.models) {
    var parts = router.models[m].split('/');
    var fileName = parts[ parts.length -1].toLowerCase();
    var nameParts = fileName.split('.');
    var name = nameParts[0];
%>
    socket.get('/<%= name %>s', function(response){
        console.log('from server:');
        console.log(response);
    })
<% }  %>

});