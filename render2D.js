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

    // Each vertex has a position and a color in XYZW RGBA order.
    const vertices = new Float32Array([
        0.0, 0.6, 0, 1, 1, 0, 0, 1,
        -0.5, -0.6, 0, 1, 0, 1, 0, 1,
        0.5, -0.6, 0, 1, 0, 0, 1, 1
    ]);

    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });

    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    vertexBuffer.unmap();

    const vertexBuffers = [{
        attributes: [{
            shaderLocation: 0, //position
            offset: 0,
            format: 'float32x4'
        }, {
            shaderLocation: 1, //color
            offset: 16,
            format: 'float32x4'
        }],
        arrayStride: 32,
        stepMode: 'vertex'
    }];

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

    const pipelineDescriptor = {
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'vertex_main',
            buffers: vertexBuffers
        },
        fragment: {
            module: vertexShaderModule,
            entryPoint: 'fragment_main',
            targets: [{
                format: 'bgra8unorm'
            }]
        },
        primitive: {
            topology: 'triangle-list'
        }
    };

    const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);
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
