
/*
  Manipulates the state of all projects in the app. Handles adding and
  removing them from window.scout.projects. Also updating the project
  settings view.
*/

(function(){

    //This will change all UI elements for Project Settings back to an empty/default state
    function resetProjectSettingsUI () {
        $("#projectIcon").attr('src', '_img/logo_128.png');
        $("#projectName").html('');
        $("#projectFolder").val('');
        $("#inputFolder").val('');
        $("#inputFolderBrowse").attr('nwworkingdir','...');
        $("#inputFolderBrowse").val('');
        $("#outputFolder").val('');
        $("#outputFolderBrowse").attr('nwworkingdir','...');
        $("#outputFolderBrowse").val('');
        $("#outputWarning").addClass('hide');
        $('#environment input[data-argname="production"]').click();
        $($("#outputStyle option")[5]).prop("selected", true);
        $("#printConsole .alert, #printConsole .panel").addClass('hide');

        var newProject = {
            "projectID":     "",
            "projectFolder": "",
            "projectName":   "",
            "imageFolder":   "",
            "projectIcon":   "",
            "inputFolder":   "",
            "outputFolder":  "",
            "environment":   "production",
            "outputStyle":   "compressed",
            "indicator":     "play"
        };
        scout.newProject = newProject;
    }

    function deleteLocalSettingsFile (bool) {
        var appData = require('nw.gui').App.dataPath;
        var file = appData + '/scout-settings.json';
        if (process.platform == "win32") {
            file = appData + '\\scout-settings.json';
        }

        if (!bool) {
            console.info('To delete this file:');
            console.log(file);
            console.info('Run this function and pass in true. Like so:');
            console.log('scout.helpers.deleteLocalSettingsFile(true);');
            return;
        }

        if (bool) {
            ugui.helpers.deleteAFile(file, function (){
                require('nw.gui').Window.get().reload();
            });
        }
    }

    /**
     * Pass in the project ID starting with 'sa' to remove it
     * from the scout.projects array.
     *
     * @param  {string}   projectID
     *
     * scout.helpers.removeProject('sa0000000000000');
     */
    function removeProject (projectID) {
        //Error checking
        if (!projectID || typeof(projectID) !== "string") {
            console.log("Can't remove project, pass in a valid project ID to remove");
            return;
        }
        if (scout.projects.length < 1) {
            console.log('Error: No projects to remove.');
            return;
        }

        //Remove the item from the scout.projects array
        for (var i = 0; i < scout.projects.length; i++) {
            var currentItem = scout.projects[i].projectID;
            if (projectID == currentItem) {
                scout.projects.remove(i);
            }
        }

        scout.helpers.stopWatching(projectID);

        //Save settings, update sidebar, click the top item in sidebar, run ftux if no items
        scout.helpers.saveSettings();
        scout.helpers.updateSidebar();
        if (scout.projects.length > 0) {
            $($("#projects-list > .btn")[0]).click();
        }
        scout.helpers.ftux();
    }

    /**
     * Pass in a object containing all the settings for a project:
     *
     * var project = {
     *        "projectID":     "sa0000000000000",
     *        "projectName":   "my-project",
     *        "projectFolder": "~/GitHub/my-project",
     *        "inputFolder":   "~/GitHub/my-project/_sass",
     *        "outputFolder":  "~/GitHub/my-project/_style",
     *        "projectIcon":   "~/GitHub/my-project/_img/meta/logo.png",
     *        "environment":   "production",
     *        "outputStyle":   "compressed"
     *    }
     *
     * @param {object}   project
     */
    function addProject (project) {
        if (!project || typeof(project) !== "object") {
            console.log("Can't add project, you need to pass in a valid project.")
            return;
        }
        if (!project.projectID ||
            !project.projectName ||
            !project.projectFolder
        ) {
            console.log("Can't add project, you are missing stuff.");
            console.log(project);
            return;
        }

        //Add to the end of the projects list
        scout.projects.push(project);

        scout.helpers.updateSidebar();
        saveSettings();
    }

    function saveCurrentProject () {
        var id = $("#projectID").val();
        for (var i = 0; i < scout.projects.length; i++) {
            var project = scout.projects[i];
            if (id == project.projectID) {
                project.projectIcon = $("#projectIcon").attr("src");

                project.inputFolder = $("#inputFolder").val();
                project.outputFolder = $("#outputFolder").val();

                var devChecked = $('#environment input[data-argname="development"]').prop("checked");
                var prodChecked = $('#environment input[data-argname="production"]').prop("checked");
                var environment = "production";
                if (devChecked) {
                    environment = "development";
                } else if (prodChecked) {
                    environment = "production";
                }
                project.environment = environment;

                project.outputStyle = $("#outputStyle").val();
            }
        }
        saveSettings();
    }

    function saveSettings () {
        var appData = require('nw.gui').App.dataPath;
        appData.split('\\').join('/');
        var settingsJSON = appData + "/scout-settings.json";
        var data = {};
        data.projects = scout.projects;
        data.versions = scout.versions;
        data.cultureCode = scout.cultureCode;
        data = JSON.stringify(data, null, 4);
        data = data + '\n';
        ugui.helpers.writeToFile(settingsJSON, data);
    }

    /**
     * This Update the UI for the Project Settings.
     * It accepts the an object for the `base` argument
     * that looks like this:
     *
     *    {
     *        "projectID":     "sa0000000000000",
     *        "projectName":   "my-project",
     *        "projectFolder": "~/GitHub/my-project",
     *        "inputFolder":   "~/GitHub/my-project/_sass",
     *        "outputFolder":  "~/GitHub/my-project/_style",
     *        "projectIcon":   "~/GitHub/my-project/_img/meta/logo.png",
     *        "environment":   "production",
     *        "outputStyle":   "compressed"
     *    }
     *
     */
    function updateProjectSettingsView (base) {
        $('#projectNameEditable .glyphicon-remove').click();
        var base = base || scout.newProject;
        $("#projectIcon"  ).attr('src', base.projectIcon);
        $("#projectName"  ).text(       base.projectName);
        $("#projectID"    ).val(        base.projectID);
        $("#projectFolder").val(        base.projectFolder);
        $("#inputFolder"  ).val(        base.inputFolder);
        $("#outputFolder" ).val(        base.outputFolder);

        var workingDir = base.projectFolder;
        if (process.platform == "win32") {
            workingDir = workingDir.split('/').join('\\');
        }

        $("#inputFolderBrowse" ).attr('nwworkingdir', workingDir);
        $("#outputFolderBrowse").attr('nwworkingdir', workingDir);

        //Output Style dropdown must be updated before Environment
        var outputStyleOption = $("#outputStyle option");
        for (var i = 1; i < outputStyleOption.length; i++) {
            var current = $(outputStyleOption[i]).val();
            if (base.outputStyle == current) {
                $(outputStyleOption[i]).prop("selected", true);
            }
        }

        //Environment
        if (base.environment == "production") {
            $('#environment input[data-argName="production"]').click();
        } else if (base.environment == "development") {
            $('#environment input[data-argName="development"]').click();
        }

        $("#printConsole .alert, #printConsole .panel").addClass('hide');
        $("#project-settings").removeClass('hide');
        $("#printConsole ." + base.projectID).removeClass('hide');
        $("#printConsoleTitle").addClass('hide');
        $("#sidebar .active").removeClass('active');
        $("#sidebar ." + base.projectID).addClass('active');
        scout.helpers.projectRenameHeight();
    }

    scout.helpers.resetProjectUI = resetProjectSettingsUI;

    //scout.helpers.deleteLocalSettingsFile(true)
    scout.helpers.deleteLocalSettingsFile = deleteLocalSettingsFile;

    //scout.helpers.updateProjectSettingsView(scout.projects[0]);
    scout.helpers.updateProjectSettingsView = updateProjectSettingsView;

    //scout.helpers.removeProject('sa1459092789554');
    scout.helpers.removeProject = removeProject;

    //scout.helpers.addProject( {projectID:'',projectName:'',projectFolder:'',inputFolder:'',outputFolder:'',projectIcon:'',environment:'',outputStyle:''} );
    scout.helpers.addProject = addProject;

    //Update the values on the scout.projects object for the currently visible project then save to file
    scout.helpers.saveCurrentProject = saveCurrentProject;

    //Save scout object to file in app data folder
    scout.helpers.saveSettings = saveSettings;

})();
