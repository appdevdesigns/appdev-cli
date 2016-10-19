/**
 * Global adapter opsportal
 *
 * The Ops Portal configuration allows you to configure the installed ops tools
 * for the portal.
 *
 */

module.exports.opsportal = {

  // list out all the possible permissions listed by
  permissions: {
    'hris.profile' : 'this user can access their individual user profile',
    'hrisadmin.objects':'this user has permission to define/redefine new objects to track in HRIS.'
  },


  // Settings for the Feedback widget
  feedback: {
    enabled: false,
    
    // The filesystem location where screenshot images will be saved.
    // This should be somewhere that a webserver serves files from.
    // e.g. '/data/www/screenshots/'
    imageBasePath: '',
    
    // The public URL for accessing the saved screenshot image.
    // e.g. 'http://example.com/screenshots/'
    imageBaseURL: '',
    
    // The GitHub user account that the feedback will be posted from.
    githubUsername: '',
    githubPassword: '',
    
    // The GitHub repository that the feeback will be posted to.
    githubRepo: 'appdev-opsportal',
    // The GitHub repository owner.
    githubOwner: 'appdevdesigns'
  },
  
  
  // The ops portal is broken down into specific "areas".  Each area shows up
  // as a menu option on the Ops Portal [Menu] list.
  areas: [
/*
      {
          icon:'fa-user',   : one of the icons offered by the Font Awesome
                              library (http://fontawesome.io/icons/).
                              if not specified 'fa-beer' is the default.
                              I suggest coming up with something more appropriate

          key:'profile',    : a unique text key for this area. (does not have
                              to be the same as the label)
                              can be lowercase, uppercase, or a mix. Just make
                              sure it is unique.

          label:'Profile',  : the label that is displayed (will be translated)

          isDefault: true,  : consider this the default area to display when
                              portal is loaded.

          tools:[           : which installed tools reside in this area

              {
                  controller:'[name]',  : which tool in /assets/opstools
                                          this value == [directoryName]
                                          so you should have a
                                          /assets/opstools/[name]

                  label:'text',         : The label displayed for this tool


                  isDefault:true,       : consider this the default tool in an
                                          area to display. (default : false)


                  permissions:[         : define the actions required for a
                                          user to be able to access this tool
                                          each entry specifies a required permission.
                                          However > 1 entry are optional groups.
                                          For example, the following specifies
                                          user must have 'hrisadmin.objects' OR ( 'opsleader AND hrleader)
                      'hrisadmin.objects'
                      , [ 'opsleader', 'hrleader']
                  ]
              }

          ]
      },

 */
      ////
      //// Administration Tools packaged with OpsPortal:
      //// 
      {
          // Define the Administration Area
          icon:'fa-cogs',
          key:'PortalAdmin',
          label:'opp.areaAdministration',
          context:'opsportal',
          tools:[{
                  // Roles and Permissions
                  controller:'RBAC',
                  label:'opp.areaAdministration',
                  context:'opsportal',
                  isDefault: true,
                  permissions:[
                      'adcore.admin'
                      , 'adcore.developer'
                  ]
              }

              // User management Interface here...
          ]
      },


      {
          // User Profile Tool
          icon:'fa-user',
          key:'profile',
          label:'Profile',
          isDefault:false,
          tools:[{
                  // Hris User Profile Tool
                  controller:'HrisUserProfile',
                  label:'Profile',
                  isDefault: true,
                  permissions:[
                      'hris.profile'
                      , 'adcore.developer'
                  ]
              },
              {
                  // Hris Admin Objects
                  controller:'HrisAdminObjects',
                  label:'Configure Objects',
                  isDefault: false,
                  permissions:[
                      'hrisadmin.objects'
                      , 'adcore.developer'
                  ]
              }

          ]
      },

      {
       // Define the Area for ProcessApproval
       icon: 'fa-cogs',
       key: 'ProcessApproval',
       label: 'opp.areaProcess',
       context: 'opsportal',
       tools: [{
         // ProcessApproval Tool
         controller: 'ProcessApproval',
         label: 'opp.toolProcessApproval',
         context: 'opsportal',
         isDefault: true,
         permissions: [
           'adcore.admin'
           , 'adcore.developer'
         ]
       },
         {
           // ProcessTranslation Tool
           controller: 'ProcessTranslation',
           label: 'opp.toolProcessTranslation',
           context: 'opsportal',
           isDefault: false,
           permissions: [
             'adcore.admin'
             , 'adcore.developer'
           ]
         }
       ]
      },

      {
       // fcf report tool
       icon: 'fa-cogs',
       key: 'FCFReports',
       label: 'Reports',
       tools: [
         {
           controller: 'ProcessReports',
           label: 'opp.toolProcessReport',
           isDefault: true,
           permissions: [
             'adcore.admin',
             'adcore.developer'
           ]
         },
         {
           controller: 'RunReports',
           label: 'opp.toolRunReport',
           isDefault: false,
           permissions: [
             'adcore.admin',
             'adcore.developer'
           ]
         }
       ]
      },

      {
       // FCF Activities
       icon: 'fa-cogs',
       key: 'FCFActivities',
       label: 'Activities',
       context: 'opsportal',
       tools: [{
         // FCFActivities tool
         controller: 'FCFActivities',
         label: 'Activities',
         context: 'opstool-FCFActivities',
         isDefault: true,
         permissions: [
           'fcf.activities'
           , 'adcore.developer'
         ]
       }]
      }

    // {
    //  icon: 'fa-cogs',
    //  key: 'FCFActivityManager',
    //  label: 'Activity Managzer',
    //  isDefault: true,
    //  tools: [
    //    {
    //      controller: 'FCFActivityManager',
    //      label: 'Activity Manager',
    //      isDefault: true,
    //      permissions: [
    //        'adcore.admin',
    //        'adcore.developer'
    //      ]
    //    }
    //  ]
    // }
/*      
      {
          // MPD Report Tool
          icon:'fa-user',
          key:'mpdreporttool',
          label:'MPD Report Tool',
          isDefault:true,
          tools:[{
              // Balance Report Tool
              controller:'MPDReport',
              label:'MPD Report Tool',
              isDefault: true,
              permissions:[
                'mpdreports.balancereports',
                'adcore.developer'
              ]
          }]
      },
      {
          // GMA Matrix Tool
          icon:'fa-cogs',
          key:'opsleader',
          label:'Ops Leader',
          tools:[{
              // GMA Matrix Entry tool
              controller:'GMAMatrix',
              label:'GMA Matrix',
              isDefault: true,
              permissions:[
                  'gma.matrix'
                  , 'adcore.developer'
              ]
          }]
      },
*/
  ]
};
