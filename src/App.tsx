import MapView from "./components/map/MapView";

function App() {
	return (
		<main className="w-screen h-screen bg-slate-950">
			<div className="p-2 h-[calc(100vh-8px)] w-[calc(100vw-8px)] rounded-3xl overflow-hidden">
				<MapView />
			</div>
		</main>
	);
}

export default App;
