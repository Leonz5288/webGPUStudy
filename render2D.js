async function main() {
    await init();
}

async function init() {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.log("webGPU is not supported on your browser!");
        return;
    }
    const device = await adapter.requestDevice();

    canvas = document.querySelector("#gpuCanvas");
    context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: "bgra8unorm"
    });

    const clearColor = { r: 0.0, g: 0.5, b: 1.0, a: 1.0 };
    const renderPassDescriptor = {
        colorAttachments: [{
            loadValue: clearColor,
            storeOp: 'store',
            view: context.getCurrentTexture().createView()
        }]
    };

    const vertexShaderModule = device.createShaderModule({
        code:
        `
        [[block]] struct VertexOut{
            [[builtin(position)]] position : vec4<f32>;
            [[location(0)]] color : vec4<f32>;
        };

        [[stage(vertex)]]
        fn vertex_main([[location(0)]] position : vec4<f32>,
                       [[location(1)]] color : vec4<f32>) -> VertexOut
        {
            var output : VertexOut;
            output.position = position;
            output.color = color;
            return output;
        }

        [[stage(fragment)]]
        fn fragment_main(fragData: VertexOut) -> [[location(0)]] vec4<f32>
        {
            return fragData.color;
        }
        `
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    // optional draww commands
    passEncoder.endPass();

    device.queue.submit([commandEncoder.finish()]);
}

function draw() {
    // requestAnimationFrame(() => {
    //    draw();
    //});
    reequestAnimationFrame(draw);
}

window.addEventListener("load", main);