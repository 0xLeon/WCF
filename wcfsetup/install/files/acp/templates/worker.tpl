<div id="workerContainer">
	<header class="box48 boxHeadline">
		<img src="{@$__wcf->getPath()}icon/working.svg" alt="" class="icon48" />
		<hgroup class="wcf-containerIcon">
			<h1>Aufgaben werden ausgeführt &hellip;</h1><!--ToDo: Language variables -->
			<h2>Aktueller Schritt: <span id="workerAction">{lang}wcf.package.installation.step.prepare{/lang}</span></h2>
			<p><progress id="workerProgress" value="0" max="100">0%</progress></p>
		</hgroup>
	</header>
	
	<div id="workerInnerContentContainer" style="display: none;">
		<div id="workerInnerContent"></div>
	</div>
</div>
