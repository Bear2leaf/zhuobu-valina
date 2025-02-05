import Alea from "alea";
import { createNoise2D } from "simplex-noise";
import TriangleMesh from "./TriangleMesh";
import MeshBuilder from "./MeshBuilder";
import PoissonDiskSampling from "poisson-disk-sampling";
import IslandMap from "./IslandMap";

export default function createIslandMap() {
    const spacing = 32;
    const distanceRNG = Alea(25);
    const simplex = { noise2D: createNoise2D(() => distanceRNG.next()) };
    const rng = Alea(25);
    const map = new IslandMap(new TriangleMesh(new MeshBuilder({ boundarySpacing: spacing }).addPoisson(PoissonDiskSampling, spacing, () => rng.next()).create()), {
        amplitude: 0.5,
        length: 4,
    }, () => (N) => Math.round(rng.next() * N));

    map.calculate({
        noise: simplex,
        shape: { round: 0.5, inflate: 0.3, amplitudes: [1 / 4, 1 / 8, 1 / 12, 1 / 16] },
        numRivers: 20,
        drainageSeed: 0,
        riverSeed: 0,
        noisyEdge: { length: 10, amplitude: 0.2, seed: 0 },
        biomeBias: { north_temperature: 0, south_temperature: 0, moisture: 0 },
    });
    return map;
}