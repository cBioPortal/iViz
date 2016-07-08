/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

if (window.cbio === undefined)
{
  window.cbio = {};
}

window.cbio.util = (function() {

    var toPrecision = function(number, precision, threshold) {
        // round to precision significant figures
        // with threshold being the upper bound on the numbers that are
        // rewritten in exponential notation

        if (0.000001 <= number && number < threshold) {
            return number.toExponential(precision);
        }

        var ret = number.toPrecision(precision);
        //if (ret.indexOf(".")!==-1)
        //    ret = ret.replace(/\.?0+$/,'');

        return ret;
    };

    var getObjectLength = function(object) {
        var length = 0;

        for (var i in object) {
            if (Object.prototype.hasOwnProperty.call(object, i)){
                length++;
            }
        }
        return length;
    };

    var checkNullOrUndefined = function(o) {
        return o === null || typeof o === "undefined";
    };

    // convert from array to associative array of element to index
    var arrayToAssociatedArrayIndices = function(arr, offset) {
        if (checkNullOrUndefined(offset)) offset=0;
        var aa = {};
        for (var i=0, n=arr.length; i<n; i++) {
            aa[arr[i]] = i+offset;
        }
        return aa;
    };
        
    var uniqueElementsOfArray = function(arr) {
        var ret = [];
        var aa = {};
        for (var i=0, n=arr.length; i<n; i++) {
            if (!(arr[i] in aa)) {
                ret.push(arr[i]);
                aa[arr[i]] = 1;
            }
        }
        return ret;
    };

    var alterAxesAttrForPDFConverter = function(xAxisGrp, shiftValueOnX, yAxisGrp, shiftValueOnY, rollback) {

        // To alter attributes of the input D3 SVG object (axis)
        // in order to prevent the text of the axes from moving up
        // when converting the SVG to PDF
        // (TODO: This is a temporary solution, need to debug batik library)
        //
        // @param xAxisGrp: the x axis D3 object
        // @param shiftValueOnX: increased/decreased value of the x axis' text vertical position of the text of x axis
        //                       before/after conversion
        // @param yAxisGrp: the y axis D3 object
        // @param shiftValueOnY: increased/decreased value of the y axis' text vertical position of the text of x axis
        //                       before/after conversion
        // @param rollback: the switch to control moving up/down the axes' text (true -> move up; false -> move down)
        //

        if (rollback)
        {
            shiftValueOnX = -1 * shiftValueOnX;
            shiftValueOnY = -1 * shiftValueOnY;
        }

        var xLabels = xAxisGrp
            .selectAll(".tick")
            .selectAll("text");

        var yLabels = yAxisGrp
            .selectAll(".tick")
            .selectAll("text");

        // TODO:
        // shifting axis tick labels a little bit because of
        // a bug in the PDF converter library (this is a hack!)
        var xy = parseInt(xLabels.attr("y"));
        var yy = parseInt(yLabels.attr("y"));

        xLabels.attr("y", xy + shiftValueOnX);
        yLabels.attr("y", yy + shiftValueOnY);
    };

    /**
     * Determines the longest common starting substring
     * for the given two strings
     *
     * @param str1  first string
     * @param str2  second string
     * @return {String} longest common starting substring
     */
    var lcss = function (str1, str2)
    {
        var i = 0;

        while (i < str1.length && i < str2.length)
        {
            if (str1[i] === str2[i])
            {
                i++;
            }
            else
            {
                break;
            }
        }

        return str1.substring(0, i);
    };

	/**
	 * Converts base 64 encoded string into an array of byte arrays.
	 *
	 * @param b64Data   base 64 encoded string
	 * @param sliceSize size of each byte array (default: 512)
	 * @returns {Array} an array of byte arrays
	 */
	function b64ToByteArrays(b64Data, sliceSize) {
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		return byteArrays;
	}

	/**
	 * Detects browser and its version.
	 * This function is implemented as an alternative to the deprecated jQuery.browser object.
	 *
	 * @return {object} browser information as an object
	 */
	var detectBrowser = function ()
	{
		var browser = {};
		var uagent = navigator.userAgent.toLowerCase();

		browser.firefox = /mozilla/.test(uagent) &&
		                  /firefox/.test(uagent);

		browser.mozilla = browser.firefox; // this is just an alias

		browser.chrome = /webkit/.test(uagent) &&
		                 /chrome/.test(uagent);

		browser.safari = /applewebkit/.test(uagent) &&
		                 /safari/.test(uagent) &&
		                 !/chrome/.test(uagent);

		browser.opera = /opera/.test(uagent);

		browser.msie = /msie/.test(uagent);

		browser.version = "";

		// check for IE 11
		if (!(browser.msie ||
		      browser.firefox ||
		      browser.chrome ||
		      browser.safari ||
		      browser.opera))
		{
			// TODO probably we need to update this for future IE versions
			if (/trident/.test(uagent))
			{
				browser.msie = true;
				browser.version = 11;
			}
		}

		if (browser.version === "")
		{
			for (var x in browser)
			{
				if (browser[x])
				{
					browser.version = uagent.match(new RegExp("(" + x + ")( |/)([0-9]+)"))[3];
					break;
				}
			}
		}

		return browser;
	};

	/**
	 * Retrieves the page origin from the global window object. This function is
	 * introduced to eliminate cross-browser issues (window.location.origin is
	 * undefined for IE)
	 */
	var getOrigin = function()
	{
		var origin = window.location.origin;

		if (!origin)
		{
			origin = window.location.protocol + "//" +
			         window.location.hostname +
			         (window.location.port ? ':' + window.location.port: '');
		}

		return origin;
	};
        
        var sortByAttribute = function(objs, attrName) {
            function compare(a,b) {
                if (a[attrName] < b[attrName])
                    return -1;
                if (a[attrName] > b[attrName])
                    return 1;
                return 0;
            }
            objs.sort(compare);
            return objs;
        };
        
	/**
	 * Replaces problematic characters with an underscore for the given string.
	 * Those characters cause problems with the properties of an HTML object,
	 * especially for the id and class properties.
	 *
	 * @param property  string to be modified
	 * @return {string} safe version of the given string
	 */
	var safeProperty = function(property)
	{
		return property.replace(/[^a-zA-Z0-9-]/g,'_');
	};

	/**
	 * Hides the child html element on mouse leave, and shows on
	 * mouse enter. This function is designed to hide a child
	 * element within a parent element.
	 *
	 * @param parentElement target of mouse events
	 * @param childElement  element to show/hide
	 */
	function autoHideOnMouseLeave(parentElement, childElement)
	{
		$(parentElement).mouseenter(function(evt) {
			childElement.fadeIn({complete: function() {
				$(this).css({"visibility":"visible"});
				$(this).css({"display":"inline"});
			}});
		});

		$(parentElement).mouseleave(function(evt) {
			// fade out without setting display to none
			childElement.fadeOut({complete: function() {
				// fade out uses hide() function, but it may change
				// the size of the parent element
				// so this is a workaround to prevent resize
				// due to display: "none"
				$(this).css({"visibility":"hidden"});
				$(this).css({"display":"inline"});
			}});
		});
	}

    function swapElement(array, indexA, indexB) {
        var tmp = array[indexA];
        array[indexA] = array[indexB];
        array[indexB] = tmp;
    }

	/**
	 * Returns the content window for the given target frame.
	 *
	 * @param id    id of the target frame
	 */
	function getTargetWindow(id)
	{
		var frame = document.getElementById(id);
		var targetWindow = frame;

		if (frame.contentWindow)
		{
			targetWindow = frame.contentWindow;
		}

		return targetWindow;
	}

	/**
	 * Returns the content document for the given target frame.
	 *
	 * @param id    id of the target frame
	 */
	function getTargetDocument(id)
	{
		var frame = document.getElementById(id);
		var targetDocument = frame.contentDocument;

		if (!targetDocument && frame.contentWindow)
		{
			targetDocument = frame.contentWindow.document;
		}

		return targetDocument;
	}

    function getLinkToPatientView(cancerStudyId, patientId) {
        return "case.do?cancer_study_id=" + cancerStudyId + "&case_id=" + patientId;
    }
    
    function getLinkToSampleView(cancerStudyId, sampleId) {
        return "case.do?cancer_study_id=" + cancerStudyId + "&sample_id=" + sampleId;
    }

    return {
        toPrecision: toPrecision,
        getObjectLength: getObjectLength,
        checkNullOrUndefined: checkNullOrUndefined,
        uniqueElementsOfArray: uniqueElementsOfArray,
        arrayToAssociatedArrayIndices: arrayToAssociatedArrayIndices,
        alterAxesAttrForPDFConverter: alterAxesAttrForPDFConverter,
        lcss: lcss,
	    b64ToByteArrays: b64ToByteArrays,
        browser: detectBrowser(), // returning the browser object, not the function itself
        getWindowOrigin: getOrigin,
        sortByAttribute: sortByAttribute,
        safeProperty: safeProperty,
        autoHideOnMouseLeave: autoHideOnMouseLeave,
        swapElement: swapElement,
	    getTargetWindow: getTargetWindow,
	    getTargetDocument: getTargetDocument,
        getLinkToPatientView: getLinkToPatientView,
        getLinkToSampleView: getLinkToSampleView
    };

})();

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        if (typeof fun !== "function") {
            throw new TypeError();
        }

        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                fun.call(thisp, this[i], i, this);
            }
        }
    };
}

/**
 * Singleton utility class for download related tasks.
 *
 * @author Selcuk Onur Sumer
 */
window.cbio.download = (function() {

  // Default client-side download options
  var _defaultOpts = {
    filename: "download.svg", // download file name
    contentType: "application/svg+xml", // download data type,
    dataType: null,      // servlet data type
    servletName: null,   // name of the data/conversion servlet (optional)
    servletParams: null, // servlet parameters (optional)
    preProcess: addSvgHeader,   // pre-process function for the provided data
    postProcess: cbio.util.b64ToByteArrays // post-process function for the data returned by the server (optional)
  };

  /**
   * Submits the download form.
   * This will send a request to the server.
   *
   * @param servletName       name of the action servlet
   * @param servletParams     params to send with the form submit
   * @param form              jQuery selector for the download form
   * @deprecated use either initDownload or clientSideDownload
   */
  function submitDownload(servletName, servletParams, form)
  {
    // remove all previous input fields (if any)
    $(form).find("input").remove();

    // add new input fields
    for (var name in servletParams)
    {
      var value = servletParams[name];
      $(form).append('<input type="hidden" name="' + name + '">');
      $(form).find('input[name="' + name + '"]').val(value);
    }

    // update target servlet for the action
    $(form).attr("action", servletName);
    // submit the form
    $(form).submit();
  }

  /**
   * Sends a download request to the hidden frame dedicated to file download.
   *
   * This function is implemented as a workaround to prevent JSmol crash
   * due to window.location change after a download request.
   *
   * @param servletName
   * @param servletParams
   * @deprecated use either initDownload or clientSideDownload
   */
  function requestDownload(servletName, servletParams)
  {
    // TODO this is a workaround, frame download doesn't work for IE
    if (cbio.util.browser.msie)
    {
      initDownloadForm();
      submitDownload(servletName, servletParams, "#global_file_download_form");
      return;
    }

    initDownloadFrame(function() {
      var targetWindow = cbio.util.getTargetWindow("global_file_download_frame");

      targetWindow.postMessage(
        {servletName: servletName,
          servletParams: servletParams},
        getOrigin());
    });
  }

  /**
   * Initializes the hidden download frame for the entire document.
   * This is to isolate download requests from the main window.
   *
   * @deprecated use either initDownload or clientSideDownload
   */
  function initDownloadFrame(callback)
  {
    var frame = '<iframe id="global_file_download_frame" ' +
      'src="file_download_frame.jsp" ' +
      'seamless="seamless" width="0" height="0" ' +
      'frameBorder="0" scrolling="no">' +
      '</iframe>';

    // only initialize if the frame doesn't exist
    if ($("#global_file_download_frame").length === 0)
    {
      $(document.body).append(frame);

      // TODO a workaround to enable target frame to get ready to listen messages
      setTimeout(callback, 500);
    }
    else
    {
      callback();
    }
  }

  /**
   * This form is initialized only for IE
   *
   * @deprecated use either initDownload or clientSideDownload
   */
  function initDownloadForm()
  {
    var form = '<form id="global_file_download_form"' +
      'style="display:inline-block"' +
      'action="" method="post" target="_blank">' +
      '</form>';

    // only initialize if the form doesn't exist
    if ($("#global_file_download_form").length === 0)
    {
      $(document.body).append(form);
    }
  }

  /**
   * Initiates a client side download for the given content array.
   *
   * @param content   data array to download
   * @param filename  download file name
   * @param type      download type
   */
  function clientSideDownload(content, filename, type)
  {
    if (type == null)
    {
      // text by default
      type = "text/plain;charset=utf-8"
    }

    if (filename == null)
    {
      filename = "download.txt";
    }

    var blob = new Blob(content, {type: type});

    saveAs(blob, filename);
  }

  /**
   * Serializes the given html element into a string.
   *
   * @param element       html element
   * @returns {string}    serialized string
   */
  function serializeHtml(element)
  {
    // convert html element to string
    var xmlSerializer = new XMLSerializer();
    return xmlSerializer.serializeToString(element);
  }

  /**
   * Adds missing xml and svg headers to the provided svg string
   *
   * @param xml   xml as a string
   * @returns {string}    new xml string with additional headers
   */
  function addSvgHeader(xml)
  {
    var svg = xml;

    var xmlHeader = "<?xml version='1.0'?>";
    var xmlVersion = "<?xml version=";

    // add xml header if not exist
    if(svg.indexOf(xmlVersion) == -1)
    {
      svg = xmlHeader + xml;
    }

    // add svg header if not exist
    if(svg.indexOf("svg xmlns") == -1)
    {
      svg = svg.replace(
        "<svg", "<svg xmlns='http://www.w3.org/2000/svg' version='1.1'");
    }

    return svg;
  }

  /**
   * Initializes a client side download for the given content.
   *
   * @param content   data content, either string or DOM element
   * @param options   download options (see _defaultOpts)
   */
  function initDownload(content, options)
  {
    options = jQuery.extend(true, {}, _defaultOpts, options);

    // try to serialize only if content is not string...
    if (!_.isString(content))
    {
      content = serializeHtml(content);
    }

    if (_.isFunction(options.preProcess))
    {
      content = options.preProcess(content);
    }

    if (options.contentType.toLowerCase().indexOf("pdf") != -1)
    {
      // if no servlet params provided, use default ones for pdf...
      options.servletParams = options.servletParams || {
          filetype: "pdf_data",
          svgelement: content
        };
    } else if (options.contentType.toLowerCase().indexOf("png") != -1)
    {
      options.servletParams = options.servletParams || {
          filetype: "png_data",
          svgelement: content
        };
    }


    // check if a servlet name provided
    if (options.servletName != null)
    {
      $.ajax({url: options.servletName,
        type: "POST",
        data: options.servletParams,
        dataType: options.dataType,
        success: function(servletData){
          var downloadData = servletData;

          if (_.isFunction(options.postProcess))
          {
            downloadData = options.postProcess(servletData);
          }

          clientSideDownload(downloadData, options.filename, options.contentType);
        }
      });
    }
    else
    {
      clientSideDownload([content], options.filename, options.contentType);
    }
  }

  return {
    submitDownload: submitDownload,
    requestDownload: requestDownload,
    clientSideDownload: clientSideDownload,
    initDownload: initDownload,
    serializeHtml: serializeHtml,
    addSvgHeader: addSvgHeader
  };
})();
